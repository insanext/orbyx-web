import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";

// Contactos bloqueados (reserva pública). Solo dueño/admin; el backend lo
// exige igual. Un contacto bloqueado no puede reservar desde la página pública
// del negocio, pero el negocio sí puede agendarle desde la Agenda.

export type BlockedContact = {
  id: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

/**
 * Pide confirmación y bloquea al contacto de un cliente o de una reserva.
 * Devuelve el mensaje a mostrar, o null si la persona canceló.
 */
export async function blockContactWithConfirm(opts: {
  slug: string;
  contactName: string;
  customerId?: string | null;
  appointmentId?: string | null;
}): Promise<string | null> {
  const name = opts.contactName?.trim() || "este contacto";
  const accepted = window.confirm(
    `¿Bloquear a ${name}?\n\nNo podrá reservar desde la página pública de tu negocio (verá un mensaje para que te contacte directamente). Tú sí podrás seguir agendándole desde la Agenda.\n\nPuedes desbloquearlo cuando quieras desde Clientes → Contactos bloqueados.`
  );
  if (!accepted) return null;

  try {
    const res = await apiFetch(
      `${BACKEND_URL}/blocked-contacts/${encodeURIComponent(opts.slug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: opts.customerId || undefined,
          appointment_id: opts.customerId ? undefined : opts.appointmentId || undefined,
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data?.error || "No pudimos bloquear al contacto. Intenta de nuevo.";
    if (data?.already_blocked) return `${name} ya estaba bloqueado.`;
    return `${name} quedó bloqueado. Ya no podrá reservar desde tu página pública.`;
  } catch {
    return "No pudimos bloquear al contacto. Revisa tu conexión e intenta de nuevo.";
  }
}
