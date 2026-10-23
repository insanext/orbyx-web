import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Datos mínimos de contacto del negocio para el "modo caído" de la página
// pública de reservas (/[slug]).
//
// Se lee directo de Supabase desde Vercel, SIN pasar por el backend de Render:
// es justamente lo que se usa cuando api.orbyx.cl no responde, así que no
// puede depender de él. Solo devuelve datos que la página pública ya muestra
// (nombre, teléfono, WhatsApp). Solo la llama el navegador cuando falló la
// carga normal de la página.

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,99}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "slug inválido" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase
      .from("tenants")
      .select("name, phone, whatsapp, is_active, paused_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "No disponible" }, { status: 503 });
    }
    if (!data) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Negocio desactivado o pausado: no se publican sus datos de contacto
    // (igual que la página normal, que en ese caso muestra "no recibe reservas").
    const contactable = data.is_active !== false && !data.paused_at;

    return NextResponse.json(
      {
        name: String(data.name || ""),
        phone: contactable ? String(data.phone || "") : "",
        whatsapp: contactable ? String(data.whatsapp || "") : "",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }
}
