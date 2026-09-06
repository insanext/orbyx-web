import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/imageCompression";

const BUCKET = "business-logos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de entorno de Supabase" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Esta ruta no pasa por middleware.ts (excluye /api/** a propósito), así
    // que la validación de sesión + membership vive acá. apiFetch() del
    // dashboard ya manda este header hoy — antes nadie lo leía.
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Token inválido o sesión expirada" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const tenantId = formData.get("tenant_id");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo válido" },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Usa JPG, PNG o WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera los 5MB permitidos" },
        { status: 400 }
      );
    }

    const { data: membership } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", String(tenantId))
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a este negocio" },
        { status: 403 }
      );
    }

    const version = `${Date.now()}-${crypto.randomUUID()}`;
    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const { buffer, contentType, extension } = await compressImage(rawBuffer, "avatar");
    const fileName = `tenants/${tenantId}/logo-${version}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      public_url: publicUrlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error subiendo logo" },
      { status: 500 }
    );
  }
}
