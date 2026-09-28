"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const turnstileRef = useRef<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      // El backend genera el link con Supabase (admin.generateLink) y lo
      // envía por Resend desde notificaciones.orbyx.cl — antes lo enviaba
      // el mailer de Supabase Auth y Gmail lo marcaba sospechoso/sin link.
      const res = await fetch(`${BACKEND_URL}/auth/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), captcha_token: captchaToken }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo procesar la solicitud. Intenta de nuevo.");
      }

      // Mensaje genérico: el backend responde ok también si el email no
      // existe (no confirmar ni negar cuentas). Un error real de envío sí
      // llega como !res.ok y se muestra arriba.
      setSent(true);
    } catch (err) {
      turnstileRef.current?.reset();
      setCaptchaToken("");
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo procesar la solicitud. Intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#070d1a" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Orbyx</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(147,197,253,0.5)" }}>
            Plataforma de reservas
          </p>
        </div>

        <div className="rounded-2xl border border-blue-900/25 p-6" style={{ background: "#0f1729" }}>
          {sent ? (
            <div className="text-center">
              <p className="text-4xl mb-3">✓</p>
              <h2 className="text-white font-semibold mb-2">Revisa tu correo</h2>
              <p className="text-sm mb-3" style={{ color: "rgba(147,197,253,0.6)" }}>
                Si el email existe en nuestro sistema, recibirás un enlace
                para restablecer tu contraseña.
              </p>
              <p className="text-xs mb-5" style={{ color: "rgba(147,197,253,0.4)" }}>
                Si no lo ves en tu bandeja de entrada en unos minutos, revisa
                tu carpeta de spam o correo no deseado.
              </p>
              <a
                href="/login"
                className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
              >
                Volver a iniciar sesión
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">
                Recuperar contraseña
              </h2>
              <p className="text-sm mb-6" style={{ color: "rgba(147,197,253,0.5)" }}>
                Ingresa tu email y te enviaremos un enlace para restablecer
                tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="text-xs mb-1.5 block"
                    style={{ color: "rgba(147,197,253,0.6)" }}
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border px-3 py-2 text-sm text-white outline-none transition-colors"
                    style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                  />
                </div>

                {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

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

                <button
                  type="submit"
                  disabled={submitting || !email || !captchaToken}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <p className="mt-5 text-center text-xs" style={{ color: "rgba(147,197,253,0.5)" }}>
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
