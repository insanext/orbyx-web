import { NextResponse } from "next/server";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const calendarId = String(body?.calendar_id || "").trim();
    const serviceId = String(body?.service_id || "").trim();
    const slotStart = String(body?.slot_start || "").trim();
    const customerName = String(body?.customer_name || "").trim();
    const customerPhone = String(body?.customer_phone || "").trim();
    const customerEmail = String(body?.customer_email || "").trim();
    const staffId =
      body?.staff_id === null || body?.staff_id === undefined
        ? null
        : String(body.staff_id).trim() || null;
    const date = String(body?.date || "").trim();
    const source = String(body?.source || "public_page").trim();

    if (!calendarId) {
      return NextResponse.json(
        { error: "calendar_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: "service_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!slotStart) {
      return NextResponse.json(
        { error: "slot_start es obligatorio" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "date es obligatorio" },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: "customer_name es obligatorio" },
        { status: 400 }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: "customer_phone es obligatorio" },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "customer_email es obligatorio" },
        { status: 400 }
      );
    }

    const payload = {
      calendar_id: calendarId,
      service_id: serviceId,
      staff_id: staffId,
      date,
      slot_start: slotStart,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      source,
    };

    const res = await fetch(`${BACKEND_URL}/appointments/slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({
      error: "Respuesta inválida del backend",
    }));

    if (!res.ok) {
      const backendMessage =
        typeof data?.error === "string" && data.error.trim()
          ? data.error.trim()
          : "No se pudo crear la reserva.";

      let finalMessage = backendMessage;

      const normalized = backendMessage.toLowerCase();

      if (
        normalized.includes("slot") &&
        (normalized.includes("no disponible") ||
          normalized.includes("ocupado") ||
          normalized.includes("tomado"))
      ) {
        finalMessage =
          "Ese horario ya no está disponible. Elige otro e inténtalo nuevamente.";
      } else if (
        normalized.includes("staff") &&
        (normalized.includes("no disponible") ||
          normalized.includes("no atiende") ||
          normalized.includes("sin disponibilidad"))
      ) {
        finalMessage =
          "Ese profesional ya no está disponible para este horario. Elige otro horario o selecciona otro profesional.";
      } else if (
        normalized.includes("reserva") &&
        (normalized.includes("activa") ||
          normalized.includes("existente") ||
          normalized.includes("futura"))
      ) {
        finalMessage =
          "Ya tienes una reserva activa o futura registrada con este correo.";
      }

      return NextResponse.json(
        {
          ...data,
          error: finalMessage,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message || "Ocurrió un error inesperado al crear la reserva",
      },
      { status: 500 }
    );
  }
}