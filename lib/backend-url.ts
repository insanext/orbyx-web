/**
 * URL pública del backend (Express en Render), en un solo lugar.
 *
 * Se configura con NEXT_PUBLIC_BACKEND_URL en Vercel; si no está definida
 * se usa el dominio propio api.orbyx.cl, que apunta al servicio de Render
 * vía CNAME (cambiar de servicio/región = cambiar el DNS, no el código).
 * Se quita el "/" final por si la variable lo trae, para no generar "//ruta".
 *
 * Next.js reemplaza process.env.NEXT_PUBLIC_* en build, así que sirve
 * tanto en componentes cliente como en rutas /api del servidor.
 */
export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.orbyx.cl"
).replace(/\/+$/, "");
