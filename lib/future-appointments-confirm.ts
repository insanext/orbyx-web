import { apiFetch } from "@/lib/api";

/**
 * Desactivar un profesional o una sucursal con citas futuras agendadas:
 * el backend (PUT /staff/:id, PATCH /branches/:id) responde 409 con
 * { requires_confirmation, future_appointments } y exige confirmación
 * explícita (auditoría 2026-09-29 sesión 2, I3/I9). Este wrapper de
 * apiFetch muestra el aviso con la cantidad y, si el usuario acepta,
 * reintenta con confirm_future_appointments: true.
 *
 * Devuelve siempre un Response que el llamador lee igual que antes
 * (res.ok / res.json()). Si el usuario cancela, es un 409 con un mensaje
 * de "no se hizo ningún cambio".
 */
export async function apiFetchConfirmingFutureAppointments(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  const res = await apiFetch(url, init);
  if (res.status !== 409) return res;

  const data = await res.clone().json().catch(() => null);
  if (!data?.requires_confirmation) return res;

  const count = Number(data.future_appointments) || 0;
  const plural = count === 1 ? "" : "s";
  const confirmed = window.confirm(
    `${label} tiene ${count} cita${plural} futura${plural} agendada${plural}.\n\n` +
      `Al desactivar, esas citas NO se cancelan: siguen vigentes y los clientes ` +
      `recibirán sus recordatorios. Te recomendamos reasignarlas o cancelarlas antes.\n\n` +
      `¿Desactivar de todas formas?`
  );

  if (!confirmed) {
    return new Response(
      JSON.stringify({ error: "Desactivación cancelada. No se hizo ningún cambio.", cancelled: true }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = JSON.parse(String(init.body || "{}"));
  return apiFetch(url, {
    ...init,
    body: JSON.stringify({ ...body, confirm_future_appointments: true }),
  });
}
