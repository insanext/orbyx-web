import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "deposit-receipts";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

// Mismo patrón que upload-business-logo (formData -> service role -> Storage),
// con dos diferencias a propósito: límite de 5MB (business-logo no tiene
// límite) y el bucket es PRIVADO — un comprobante de transferencia es un
// documento financiero, no se sirve desde una URL pública fija como el logo.
// No hay public_url en la respuesta, solo el path; la vista del dashboard
// pide un signed URL bajo demanda (GET /appointments/:id/deposit-receipt-url).
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
    const appointmentId = formData.get("appointment_id");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo válido" },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id es obligatorio" }, { status: 400 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "appointment_id es obligatorio" }, { status: 400 });
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Formato inválido. Usa JPG, PNG o PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera los 5MB permitidos" },
        { status: 400 }
      );
    }

    const safeExt = ALLOWED_TYPES[file.type];
    const version = `${Date.now()}-${crypto.randomUUID()}`;
    const fileName = `tenants/${tenantId}/appointments/${appointmentId}/receipt-${version}.${safeExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return NextResponse.json({
      ok: true,
      path: fileName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error subiendo comprobante" },
      { status: 500 }
    );
  }
}
