import { NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; serviceId: string }> }
) {
  try {
    const { slug, serviceId } = await params;
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const staffId = searchParams.get("staff_id");
    const branchId = searchParams.get("branch_id");

    if (!slug || !serviceId) {
      return NextResponse.json(
        { error: "slug y serviceId son obligatorios" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "date es obligatorio" },
        { status: 400 }
      );
    }

    const backendQuery = new URLSearchParams();
    backendQuery.set("date", date);

    if (staffId) {
      backendQuery.set("staff_id", staffId);
    }

    if (branchId) {
      backendQuery.set("branch_id", branchId);
    }

    const res = await fetch(
      `${BACKEND_URL}/public/slots/${encodeURIComponent(slug)}/${encodeURIComponent(serviceId)}?${backendQuery.toString()}`,
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
      { error: error?.message || "Error obteniendo slots públicos" },
      { status: 500 }
    );
  }
}