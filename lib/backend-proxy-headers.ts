/**
 * Cabeceras que las rutas /api de Next (página pública) mandan al backend para
 * que sepa la IP real del visitante.
 *
 * Sin esto, el backend ve siempre la IP de salida de Vercel y sus límites por
 * IP funcionan como un único cupo compartido por todos los visitantes.
 *
 * - La IP sale de las cabeceras que Vercel fija en el borde (x-real-ip /
 *   x-forwarded-for): el visitante no puede falsificarlas.
 * - El backend solo confía en x-orbyx-client-ip si x-orbyx-proxy-secret
 *   coincide con su propio ORBYX_PROXY_SECRET (mismo valor en Vercel y Render).
 * - Sin ORBYX_PROXY_SECRET no se manda nada y todo funciona como antes.
 */
export function backendProxyHeaders(req: Request): Record<string, string> {
  const secret = process.env.ORBYX_PROXY_SECRET;
  if (!secret) return {};

  const ip =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  if (!ip) return {};

  return {
    "x-orbyx-client-ip": ip,
    "x-orbyx-proxy-secret": secret,
  };
}
