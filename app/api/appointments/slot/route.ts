import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend-url";
import { backendProxyHeaders } from "@/lib/backend-proxy-headers";

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
      // Extras elegidos (ids). El backend valida y calcula precio/minutos.
      extra_ids: Array.isArray(body.extra_ids)
        ? body.extra_ids.map(normalizeUuidLike).filter(Boolean).slice(0, 10)
        : [],
      staff_id: normalizeUuidLike(body.staff_id),
      date: body.date,
      slot_start: body.slot_start,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      // Token de Turnstile (reserva pública). Las reservas del dashboard no
      // llevan captcha.
      ...(isDashboardBooking ? {} : { captcha_token: body.captcha_token || null }),
      source: isDashboardBooking ? "dashboard" : "public_page",
      customer_data: body.customer_data || null,
      ...(isDashboardBooking ? { booking_origin: "dashboard" } : {}),
      // Hora libre, sobrecupo y fuera de horario: solo desde el panel. En la
      // reserva pública nunca se reenvían (y el backend además los ignora si
      // no hay sesión de un miembro con permiso de Agenda).
      ...(isDashboardBooking
        ? {
            ...(typeof body.manual_time === "string" && body.manual_time
              ? { manual_time: body.manual_time }
              : {}),
            ...(body.forzar_sobrecupo === true ? { forzar_sobrecupo: true } : {}),
            ...(body.forzar_fuera_horario === true ? { forzar_fuera_horario: true } : {}),
          }
        : {}),
    };

    const res = await fetch(`${BACKEND_URL}/appointments/slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...backendProxyHeaders(req),
        ...(isDashboardBooking && authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.error || "No se pudo crear la reserva",
          // 409 de confirmación del panel (cruce y/o fuera de horario): el
          // modal necesita el detalle. Solo se agrega cuando viene.
          ...(data?.requires_confirmation
            ? {
                requires_confirmation: true,
                conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
                out_of_hours: Boolean(data.out_of_hours),
                out_of_hours_reason: data.out_of_hours_reason ?? null,
              }
            : {}),
          ...(data?.code ? { code: data.code } : {}),
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