import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "slug es obligatorio" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const backendRes = await fetch(
      `${BACKEND_URL}/public/reviews/${encodeURIComponent(slug)}/verify-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await backendRes.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error verificando el link" },
      { status: 500 }
    );
  }
}
