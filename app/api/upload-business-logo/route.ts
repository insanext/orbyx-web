import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "business-logos";

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

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `tenants/${tenantId}/logo.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type || "image/png",
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
