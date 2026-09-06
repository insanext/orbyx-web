import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/imageCompression";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
    const staffId = formData.get("staff_id");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo válido" },
        { status: 400 }
      );
    }

    if (!staffId) {
      return NextResponse.json(
        { error: "staff_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Formato inválido. Usa JPG, PNG o WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera los 2MB permitidos" },
        { status: 400 }
      );
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, tenant_id")
      .eq("id", staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: "Staff no encontrado" },
        { status: 404 }
      );
    }

    const { data: membership } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", staff.tenant_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a este negocio" },
        { status: 403 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const { buffer, contentType, extension } = await compressImage(rawBuffer, "avatar");
    const fileName = `staff/${staffId}.${extension}`;

    // Best-effort: si esta foto ya existía con otra extensión (formato
    // previo a agregar compresión), limpia esa variante para no dejar un
    // archivo huérfano — mismo patrón de candidatos ya usado en
    // DELETE /admin/tenants/:id (server.js) para este mismo bucket.
    const otherExts = ["jpg", "png", "webp"].filter((ext) => ext !== extension);
    if (otherExts.length) {
      await supabase.storage
        .from("staff-photos")
        .remove(otherExts.map((ext) => `staff/${staffId}.${ext}`))
        .catch(() => {});
    }

    const { error: uploadError } = await supabase.storage
      .from("staff-photos")
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("staff-photos")
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      public_url: publicUrlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error subiendo imagen" },
      { status: 500 }
    );
  }
}
