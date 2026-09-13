// Lógica compartida de mensajes manuales por WhatsApp (wa.me, sin Twilio,
// sin plantillas — el negocio edita/envía manualmente) — usada desde el
// módulo Clientes, y desde el modal de Detalle de reserva de Agenda
// ("Pedir reseña", "Confirmar por WhatsApp", "Recordatorio manual"). No
// duplicar la construcción del link en cada callsite.
import { apiFetch } from "@/lib/api";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// Arma el link wa.me con el mensaje precargado. Devuelve null si el
// teléfono no tiene dígitos (nada que limpiar/normalizar más allá de eso —
// wa.me acepta el número con o sin "+").
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const whatsappNumber = (phone || "").replace(/\D/g, "");
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export async function requestReviewViaWhatsapp({
  slug,
  customerId,
  customerPhone,
  businessName,
}: {
  slug: string;
  customerId: string;
  customerPhone?: string | null;
  businessName: string;
}) {
  if (!(customerPhone || "").replace(/\D/g, "")) {
    throw new Error("Este cliente no tiene un teléfono registrado.");
  }

  const res = await apiFetch(`${BACKEND_URL}/reviews/${slug}/request-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id: customerId }),
  });
  const data = await res.json();

  if (!res.ok || !data.token) {
    throw new Error(data.error || "No se pudo generar el link de reseña.");
  }

  const reviewUrl = `https://orbyx.cl/${slug}/opinar?t=${data.token}`;
  const greeting = data.customer_name ? `¡Hola ${data.customer_name}!` : "¡Hola!";
  const message = `${greeting} Gracias por visitarnos${
    businessName ? ` en ${businessName}` : ""
  }. ¿Nos ayudarías dejando una reseña? Aquí puedes hacerlo: ${reviewUrl}`;

  const link = buildWhatsAppLink(customerPhone, message);
  if (!link) {
    throw new Error("Este cliente no tiene un teléfono registrado.");
  }

  window.open(link, "_blank", "noopener,noreferrer");
}
