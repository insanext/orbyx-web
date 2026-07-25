"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";

export default function ActualizarPasswordPage() {
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "success">(
    "checking"
  );
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Supabase procesa el token de recuperación de la URL automáticamente al
  // cargar el cliente y dispara el evento PASSWORD_RECOVERY. Si ese evento
  // ya se disparó antes de que nos suscribamos (carrera con el
  // procesamiento del link), getSession() igual confirma que ya quedó una
  // sesión válida para actualizar el password.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && mounted) {
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setStatus((prev) => (prev === "ready" ? "ready" : session ? "ready" : "invalid"));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPwd) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo actualizar la contraseña. Intenta de nuevo."
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

        {status === "checking" && (
          <div className="rounded-2xl border border-blue-900/25 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>
              Verificando enlace...
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="rounded-2xl border border-red-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✗</p>
            <h2 className="text-white font-semibold mb-2">Enlace no válido o expirado</h2>
            <p className="text-sm text-red-400/70 mb-5">
              Solicita un nuevo enlace para restablecer tu contraseña.
            </p>
            <a
              href="/recuperar-password"
              className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
            >
              Solicitar nuevo enlace
            </a>
          </div>
        )}

        {status === "success" && (
          <div className="rounded-2xl border border-green-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✓</p>
            <h2 className="text-white font-semibold mb-2">Contraseña actualizada</h2>
            <p className="text-sm text-green-400/70">Redirigiendo a inicio de sesión...</p>
          </div>
        )}

        {status === "ready" && (
          <div className="rounded-2xl border border-blue-900/25 p-6" style={{ background: "#0f1729" }}>
            <h2 className="text-white font-semibold text-lg mb-1">Crea tu nueva contraseña</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(147,197,253,0.5)" }}>
              Elige una nueva contraseña para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

              <button
                type="submit"
                disabled={submitting || !password || !confirmPwd}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40"
              >
                {submitting ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
