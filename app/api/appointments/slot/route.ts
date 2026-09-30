import { NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

function normalizeUuidLike(value: unknown) {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();

  if (
    !normalized ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "null"
  ) {
    return null;
  }

  return normalized;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Reserva manual desde Agenda: el backend la exime de depósito,
    // anticipación mínima y máximo de días, pero solo si además recibe la
    // sesión de un miembro del negocio con permiso de Agenda — por eso se
    // reenvía el Authorization que ya agrega apiFetch. La reserva pública
    // no manda ninguno de los dos.
    const isDashboardBooking = body.booking_origin === "dashboard";
    const authorization = req.headers.get("authorization");

    const payload = {
      calendar_id: normalizeUuidLike(body.calendar_id),
      branch_id: normalizeUuidLike(body.branch_id),
      service_id: normalizeUuidLike(body.service_id),
      staff_id: normalizeUuidLike(body.staff_id),
      date: body.date,
      slot_start: body.slot_start,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      source: isDashboardBooking ? "dashboard" : "public_page",
      customer_data: body.customer_data || null,
      ...(isDashboardBooking ? { booking_origin: "dashboard" } : {}),
    };

    const res = await fetch(`${BACKEND_URL}/appointments/slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isDashboardBooking && authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.error || "No se pudo crear la reserva",
          debug_payload: payload,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error inesperado" },
      { status: 500 }
    );
  }
}