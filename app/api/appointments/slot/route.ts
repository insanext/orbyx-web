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
      source: "public_page",
      customer_data: body.customer_data || null,
    };

    const res = await fetch(`${BACKEND_URL}/appointments/slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      let message = data?.error || "No se pudo crear la reserva";
      const normalized = String(message).toLowerCase();

      if (
        normalized.includes("slot") ||
        normalized.includes("horario") ||
        normalized.includes("appointments_unique_slot") ||
        normalized.includes("duplicate key") ||
        normalized.includes("unique constraint")
      ) {
        message = "Ese horario ya no está disponible.";
      } else if (normalized.includes("staff")) {
        message = "El profesional ya no está disponible.";
      } else if (
        normalized.includes("email ya tiene una reserva futura activa") ||
        normalized.includes("reserva futura activa") ||
        normalized.includes("ya tiene una reserva activa")
      ) {
        message = "Ya tienes una reserva activa con este correo.";
      } else if (
        normalized.includes("invalid input syntax for type uuid") ||
        normalized.includes("uuid")
      ) {
        message = "Ocurrió un error con los datos de la reserva. Recarga la página e inténtalo nuevamente.";
      }

      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error inesperado" },
      { status: 500 }
    );
  }
}