// Lógica compartida de "Pedir reseña" — usada desde el módulo Clientes y
// desde el modal de Detalle de reserva de Agenda. No duplicar: ambos deben
// generar el mismo link personalizado (con token) y el mismo mensaje.
import { apiFetch } from "@/lib/api";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

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
  const whatsappNumber = (customerPhone || "").replace(/\D/g, "");
  if (!whatsappNumber) {
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

  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
