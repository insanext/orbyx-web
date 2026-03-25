import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string; service_id: string }> }
) {
  try {
    const { slug, service_id } = await context.params;

    if (!slug || !service_id) {
      return NextResponse.json(
        { error: "slug y service_id son obligatorios" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branch_id");

    const backendQuery = new URLSearchParams();

    if (branchId) {
      backendQuery.set("branch_id", branchId);
    }

    const queryString = backendQuery.toString();
    const backendUrl =
      `${BACKEND_URL}/public/staff/${encodeURIComponent(slug)}/${encodeURIComponent(service_id)}` +
      (queryString ? `?${queryString}` : "");

    const res = await fetch(backendUrl, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error obteniendo staff público" },
      { status: 500 }
    );
  }
}