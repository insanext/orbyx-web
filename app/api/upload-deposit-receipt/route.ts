import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "deposit-receipts";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

// Ruta pública/anónima a propósito (el cliente todavía no tiene cuenta al
// subir el comprobante) — no puede exigir sesión como upload-staff-photo o
// upload-business-logo. Mitigación equivalente: exige que appointment_id +
// tenant_id correspondan a una reserva real con deposit_status='pending'
// (ventana de ~15 min, ver deposit-required.sql) antes de aceptar el
// archivo, así no se puede subir a un tenant/appointment arbitrario o ya
// resuelto. Rate limit best-effort en memoria por IP: al ser una función
// serverless, no persiste entre instancias/cold starts — reduce ráfagas
// desde una misma instancia pero no es una defensa distribuida real: si
// se necesita eso, hace falta un store compartido (ej. Vercel KV/Upstash).
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitHits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitHits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }

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

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", String(appointmentId))
      .eq("tenant_id", String(tenantId))
      .eq("deposit_status", "pending")
      .maybeSingle();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Reserva no encontrada o ya no está pendiente de depósito" },
        { status: 404 }
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
