"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "../../lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Iniciar sesión
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos."
            : signInError.message
        );
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("No se pudo verificar el usuario. Intenta nuevamente.");
        return;
      }

      // 2. Resolver el slug del tenant del usuario
      //    Requiere que RLS permita al usuario leer su propio tenant_users.
      const { data: tenantUserRow, error: tuError } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (tuError || !tenantUserRow) {
        // El usuario existe en Auth pero no tiene tenant asociado.
        // Puede ocurrir si la cuenta fue creada manualmente o el provision falló.
        setError(
          "Tu cuenta no tiene un negocio asociado. Contacta al administrador."
        );
        return;
      }

      const { data: tenantRow, error: tenantError } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", tenantUserRow.tenant_id)
        .single();

      if (tenantError || !tenantRow?.slug) {
        setError("No se pudo cargar el negocio. Intenta nuevamente.");
        return;
      }

      // 3. Redirigir al destino guardado o al dashboard del tenant
      const redirectTo = searchParams.get("redirectTo");
      const destination =
        redirectTo && redirectTo.startsWith("/dashboard")
          ? redirectTo
          : `/dashboard/${tenantRow.slug}`;

      router.replace(destination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado. Intenta nuevamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f3f7ff, #eaf1ff 46%, #eef4ff)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 24,
          border: "1px solid rgba(59,130,246,0.18)",
          boxShadow:
            "0 20px 60px -20px rgba(37,99,235,0.14), 0 2px 8px -2px rgba(37,99,235,0.06)",
          padding: "36px 32px",
        }}
      >
        {/* Logotipo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 14,
              background:
                "conic-gradient(from 180deg, rgb(14,165,233), rgb(79,70,229), rgb(34,211,238), rgb(14,165,233))",
              color: "white",
              fontWeight: 700,
              fontSize: 20,
              marginBottom: 16,
              boxShadow: "0 12px 28px -18px rgba(14,165,233,0.9)",
            }}
          >
            O
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            Bienvenido a Orbyx
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Ingresa a tu panel de negocio
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                height: 44,
                borderRadius: 12,
                border: "1px solid rgba(59,130,246,0.28)",
                padding: "0 14px",
                fontSize: 14,
                color: "#0f172a",
                background: "#f8fbff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                height: 44,
                borderRadius: 12,
                border: "1px solid rgba(59,130,246,0.28)",
                padding: "0 14px",
                fontSize: 14,
                color: "#0f172a",
                background: "#f8fbff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error ? (
            <div
              style={{
                borderRadius: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                padding: "10px 14px",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 46,
              borderRadius: 14,
              border: "none",
              background: loading
                ? "rgba(79,70,229,0.5)"
                : "linear-gradient(135deg, rgb(79,70,229), rgb(37,99,235) 45%, rgb(14,165,233))",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 8px 24px -12px rgba(37,99,235,0.7)",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        {/* Nota inferior */}
        <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
          ¿No tienes cuenta?{" "}
          <a
            href="/signup"
            style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
          >
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
