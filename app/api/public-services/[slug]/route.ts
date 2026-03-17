import { NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "slug es obligatorio" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BACKEND_URL}/public/services/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error obteniendo servicios públicos" },
      { status: 500 }
    );
  }
}