import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");

    if (!slug) {
      return NextResponse.json(
        { error: "slug es obligatorio" },
        { status: 400 }
      );
    }

    const backendQuery = new URLSearchParams();
    if (branchId) {
      backendQuery.set("branch_id", branchId);
    }

    const servicesUrl = `${BACKEND_URL}/public/services/${encodeURIComponent(slug)}${
      backendQuery.toString() ? `?${backendQuery.toString()}` : ""
    }`;

    const servicesRes = await fetch(servicesUrl, {
      cache: "no-store",
    });

    const servicesData = await servicesRes.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    if (!servicesRes.ok) {
      return NextResponse.json(servicesData, { status: servicesRes.status });
    }

    let branches: Array<{ id: string; name: string }> = [];

    const tenantId = servicesData?.business?.id;

    if (tenantId) {
      const branchesRes = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${encodeURIComponent(String(tenantId))}`,
        {
          cache: "no-store",
        }
      );

      const branchesData = await branchesRes.json().catch(() => ({
        branches: [],
      }));

      if (branchesRes.ok && Array.isArray(branchesData?.branches)) {
        branches = branchesData.branches.map((item: any) => ({
          id: String(item.id),
          name: String(item.name || "Sucursal"),
        }));
      }
    }

    return NextResponse.json(
      {
        ...servicesData,
        branches,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error obteniendo servicios públicos" },
      { status: 500 }
    );
  }
}