import { NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      calendar_id: body.calendar_id,
      service_id: body.service_id,
      staff_id: body.staff_id || null,
      date: body.date,
      slot_start: body.slot_start,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      source: "public_page",
      customer_data: body.customer_data || null, // 🔥 IMPORTANTE (campos dinámicos)
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

      const normalized = message.toLowerCase();

      if (normalized.includes("slot")) {
        message = "Ese horario ya no está disponible.";
      }

      if (normalized.includes("staff")) {
        message = "El profesional ya no está disponible.";
      }

      if (normalized.includes("reserva")) {
        message = "Ya tienes una reserva activa con este correo.";
      }

      return NextResponse.json(
        { error: message },
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