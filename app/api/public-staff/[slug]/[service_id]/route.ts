import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; service_id: string }> }
) {
  try {
    const { slug, service_id } = await context.params;

    const res = await fetch(
      `https://orbyx-backend.onrender.com/public/staff/${slug}/${service_id}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();

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