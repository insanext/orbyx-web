"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";
import { BACKEND_URL } from "@/lib/backend-url";

export default function InvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const [step, setStep] = useState<"loading" | "form" | "success" | "error">("loading");
  const [invitation, setInvitation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<any>(null);
  // La invitación es para un correo que YA tiene cuenta: no se crea ni se
  // cambia ninguna contraseña; la persona inicia sesión y acepta con su sesión.
  const [joinedExisting, setJoinedExisting] = useState(false);
  const [sessionMatches, setSessionMatches] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/invitations/token/${token}`)
      .then(async res => {
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Invitación no válida o ya fue usada.");
        }
        return res.json();
      })
      .then(async data => {
        setInvitation(data);
        if (data.account_exists) {
          try {
            const supabase = createClient();
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionEmail = String(sessionData.session?.user?.email || "").toLowerCase();
            setSessionMatches(
              Boolean(sessionEmail) && sessionEmail === String(data.email || "").toLowerCase()
            );
          } catch {
            setSessionMatches(false);
          }
        }
        setStep("form");
      })
      .catch(e => {
        setErrorMsg(e.message);
        setStep("error");
      });
  }, [token]);

  const handleAcceptExisting = async () => {
    if (!sessionMatches && !password) {
      setSubmitMsg("Ingresa tu contraseña.");
      return;
    }
    if (!sessionMatches && !captchaToken) {
      setSubmitMsg("Completa la verificación de seguridad.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const supabase = createClient();
      let accessToken = "";

      if (sessionMatches) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData.session?.access_token || "";
      }

      if (!accessToken) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password,
          options: { captchaToken },
        });
        if (signInErr) throw new Error(signInErr.message);
        accessToken = signInData.session?.access_token || "";
      }

      const res = await fetch(`${BACKEND_URL}/invitations/accept/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al aceptar invitación.");

      setJoinedExisting(true);
      setStep("success");
      setTimeout(() => {
        router.push(data.tenant_slug ? `/dashboard/${data.tenant_slug}/agenda` : "/");
      }, 2000);
    } catch (e: any) {
      setSubmitMsg(e.message);
      // Sesión vencida o de otro usuario: pasa al formulario con contraseña.
      setSessionMatches(false);
      turnstileRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
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
      const res = await fetch(`${BACKEND_URL}/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Alguien creó la cuenta entre la carga de la página y este envío.
        if (data.requires_login) {
          setInvitation((prev: any) => ({ ...prev, account_exists: true }));
          setPassword("");
          setConfirmPwd("");
          setCaptchaToken("");
        }
        throw new Error(data.error ?? "Error al aceptar invitación.");
      }

      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
        options: { captchaToken },
      });
      if (signInErr) throw new Error(signInErr.message);

      setStep("success");
      setTimeout(() => {
        router.push(data.tenant_slug ? `/dashboard/${data.tenant_slug}/agenda` : "/");
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
          <p className="text-sm mt-1" style={{ color: "rgba(147,197,253,0.5)" }}>Plataforma de reservas</p>
        </div>

        {step === "loading" && (
          <div className="rounded-2xl border border-blue-900/25 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>Verificando invitación...</p>
          </div>
        )}

        {step === "error" && (
          <div className="rounded-2xl border border-red-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✗</p>
            <h2 className="text-white font-semibold mb-2">Invitación no válida</h2>
            <p className="text-sm text-red-400/70">{errorMsg}</p>
          </div>
        )}

        {step === "success" && (
          <div className="rounded-2xl border border-green-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✓</p>
            <h2 className="text-white font-semibold mb-2">¡Bienvenido a Orbyx!</h2>
            <p className="text-sm text-green-400/70">
              {joinedExisting
                ? "Ya eres parte del equipo. Redirigiendo al dashboard..."
                : "Tu cuenta fue creada. Redirigiendo al dashboard..."}
            </p>
          </div>
        )}

        {step === "form" && invitation && invitation.account_exists && (
          <div className="rounded-2xl border border-blue-900/25 p-6" style={{ background: "#0f1729" }}>
            <h2 className="text-white font-semibold text-lg mb-1">Ya tienes una cuenta</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(147,197,253,0.5)" }}>
              Fuiste invitado a{" "}
              <span className="text-white font-medium">{invitation.tenant_name}</span>.
              {" "}{sessionMatches
                ? "Ya iniciaste sesión con este correo: acepta la invitación para unirte."
                : "Inicia sesión con tu contraseña de siempre para aceptar la invitación."}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                  Correo electrónico
                </label>
                <input
                  value={invitation.email}
                  disabled
                  className="w-full rounded-xl border px-3 py-2 text-sm cursor-not-allowed opacity-40 outline-none"
                  style={{ background: "rgba(10,15,30,0.5)", borderColor: "rgba(37,99,235,0.2)", color: "#e2e8f0" }}
                />
              </div>
              {!sessionMatches && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      className="w-full rounded-xl border pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                      style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                    />
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword(v => !v)}
                      className="text-blue-300/50 hover:text-blue-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {!sessionMatches && (
              <div className="flex justify-center mb-5">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                  options={{ theme: "dark" }}
                />
              </div>
            )}

            {submitMsg && (
              <p className="text-xs text-red-400 mb-3">{submitMsg}</p>
            )}

            <button
              onClick={handleAcceptExisting}
              disabled={submitting || (!sessionMatches && (!password || !captchaToken))}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              {submitting
                ? "Aceptando..."
                : sessionMatches
                ? "Aceptar invitación"
                : "Iniciar sesión y aceptar"}
            </button>
          </div>
        )}

        {step === "form" && invitation && !invitation.account_exists && (
          <div className="rounded-2xl border border-blue-900/25 p-6" style={{ background: "#0f1729" }}>
            <h2 className="text-white font-semibold text-lg mb-1">Crea tu contraseña</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(147,197,253,0.5)" }}>
              Fuiste invitado a{" "}
              <span className="text-white font-medium">{invitation.tenant_name}</span>.
              {" "}Crea tu contraseña para acceder al dashboard.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                  Correo electrónico
                </label>
                <input
                  value={invitation.email}
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
                    onChange={e => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                    style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                  />
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword(v => !v)}
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
                    onChange={e => setConfirmPwd(e.target.value)}
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                    style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                  />
                  <PasswordVisibilityToggle
                    visible={showConfirmPwd}
                    onToggle={() => setShowConfirmPwd(v => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                options={{ theme: "dark" }}
              />
            </div>

            {submitMsg && (
              <p className="text-xs text-red-400 mb-3">{submitMsg}</p>
            )}

            <button
              onClick={handleAccept}
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
