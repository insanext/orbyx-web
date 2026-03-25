import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function GET(
  req: NextRequest,
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

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branch_id");

    const servicesQuery = new URLSearchParams();
    if (branchId) {
      servicesQuery.set("branch_id", branchId);
    }

    const servicesUrl =
      `${BACKEND_URL}/public/services/${encodeURIComponent(slug)}` +
      (servicesQuery.toString() ? `?${servicesQuery.toString()}` : "");

    const servicesRes = await fetch(servicesUrl, {
      cache: "no-store",
    });

    const servicesData = await servicesRes.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    if (!servicesRes.ok) {
      return NextResponse.json(servicesData, { status: servicesRes.status });
    }

    const tenantId = servicesData?.business?.id;

    let branches: any[] = [];

    if (tenantId) {
      const branchesRes = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          cache: "no-store",
        }
      );

      const branchesData = await branchesRes.json().catch(() => ({
        branches: [],
      }));

      if (branchesRes.ok && Array.isArray(branchesData?.branches)) {
        branches = branchesData.branches.filter(
          (branch: any) => branch?.is_active !== false
        );
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