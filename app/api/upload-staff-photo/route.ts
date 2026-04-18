import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo válido" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop() || "jpg";
const staffId = formData.get("staff_id");

if (!staffId) {
  return NextResponse.json(
    { error: "staff_id es obligatorio" },
    { status: 400 }
  );
}

const fileName = `staff/${staffId}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("staff-photos")
.upload(fileName, buffer, {
  contentType: file.type || "image/jpeg",
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