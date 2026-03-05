"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = useMemo(() => {
    const p = (searchParams.get("plan") || "starter").toLowerCase();
    if (p === "pro" || p === "enterprise" || p === "starter") return p;
    return "starter";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo obtener user_id del signup");

      // 2) Provisionar tenant + owner (backend Render)
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;
      const resp = await fetch(`${backend}/tenants/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email, plan }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.detail || json?.error || "Error provisionando tenant");
      }

      // 3) Ir a onboarding
      router.push(`/onboarding?tenant_id=${json.tenant_id}`);
    } catch (err: any) {
      setMsg(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Crear cuenta</h1>
      <p style={{ opacity: 0.8 }}>Plan seleccionado: <b>{plan}</b></p>

      <form onSubmit={handleSignup} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      </form>
    </div>
  );
}