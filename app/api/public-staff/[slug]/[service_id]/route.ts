import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; serviceId: string }> }
) {
  try {
    const { slug, serviceId } = await context.params;

    if (!slug || !serviceId) {
      return NextResponse.json(
        { error: "slug y serviceId son obligatorios" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BACKEND_URL}/public/staff/${encodeURIComponent(slug)}/${encodeURIComponent(serviceId)}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error obteniendo staff público" },
      { status: 500 }
    );
  }
}