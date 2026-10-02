// Arma "calle, comuna, región" para el mapa/vista previa del dashboard (en
// vivo, mientras se edita el formulario). Mismo criterio que
// formatFullAddress() de server.js — que es la que usan los mensajes al
// cliente — pero acá solo para previsualizar lo que todavía no se guardó.
// Sin calle devuelve "": no se geocodifica una comuna suelta.
export function buildFullAddress(
  street?: string | null,
  commune?: string | null,
  region?: string | null
): string {
  const cleanStreet = String(street ?? "").trim();
  if (!cleanStreet) return "";

  const streetSegments = cleanStreet
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const parts = [cleanStreet];
  for (const raw of [commune, region]) {
    const part = String(raw ?? "").trim();
    if (!part) continue;
    if (streetSegments.includes(part.toLowerCase())) continue;
    parts.push(part);
  }
  return parts.join(", ");
}
