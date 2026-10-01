/**
 * apiFetch — wrapper de fetch con Authorization automático.
 *
 * Obtiene el access_token de la sesión activa de Supabase y lo inyecta
 * como header `Authorization: Bearer <token>` en cada request.
 *
 * Contrato idéntico al fetch() nativo:
 *   - Mismos parámetros: (input: RequestInfo | URL, init?: RequestInit)
 *   - Misma respuesta: Promise<Response>
 *
 * Si no hay sesión activa, hace el fetch igualmente sin el header
 * para no romper flujos públicos.
 *
 * Uso:
 *   import { apiFetch } from "@/lib/api";
 *   const res = await apiFetch(`${BACKEND_URL}/members?tenant_id=${tenantId}`);
 */

import { createClient } from "@/lib/supabase/client";
import { trackBusy } from "@/lib/busy-feedback";

export function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // Se engancha al botón tocado AQUÍ (síncrono dentro del handler), porque el
  // fetch real ocurre después de leer la sesión y podría salir fuera de la
  // ventana de atribución del click.
  return trackBusy(apiFetchInner(input, init));
}

async function apiFetchInner(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
