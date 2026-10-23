import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Cabeceras de seguridad (ronda pre-lanzamiento).
//
// - La CSP va en modo REPORT-ONLY: el navegador NO bloquea nada, solo avisa
//   en la consola ("[Report Only] Refused to ...") lo que bloquearía. Se revisa
//   unos días y recién ahí se pasa a "Content-Security-Policy".
// - Las páginas públicas de reserva (/{slug}) SÍ se pueden embeber en sitios de
//   terceros: no llevan X-Frame-Options ni frame-ancestors. Todo lo demás
//   (landing, login, signup, dashboard, admin, billing, API, etc.) lleva
//   X-Frame-Options: DENY + frame-ancestors 'none'.
// ---------------------------------------------------------------------------

const isDev = process.env.NODE_ENV !== "production";

// Rutas de primer nivel que NO son páginas de negocio (/{slug}). Se arma con
// las carpetas reales de app/ para que una página nueva quede protegida
// contra embebido sin acordarse de agregarla acá (falla cerrado); la lista
// fija es un respaldo por si no se puede leer el disco.
const FALLBACK_RESERVED_SEGMENTS = [
  "account",
  "actualizar-password",
  "admin",
  "api",
  "auth",
  "cancel",
  "checkout",
  "checkout-premium",
  "completar-registro",
  "dashboard",
  "desuscribir",
  "invite",
  "login",
  "nosotros",
  "onboarding",
  "pago-exitoso",
  "planes",
  "privacidad",
  "recuperar-password",
  "signup",
  "terminos",
  "welcome",
];

function getReservedSegments(): string[] {
  const found = new Set<string>(FALLBACK_RESERVED_SEGMENTS);
  try {
    const appDir = path.join(process.cwd(), "app");
    for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      // [slug] es la página de negocio; (grupos) y _privadas no son rutas.
      if (name.startsWith("[") || name.startsWith("(") || name.startsWith("_") || name.startsWith("@")) {
        continue;
      }
      if (/^[a-z0-9-]+$/i.test(name)) found.add(name);
    }
  } catch {
    // se usa solo la lista de respaldo
  }
  return [...found].sort();
}

function originOf(value: string | undefined, fallback: string): string {
  try {
    return new URL(value || fallback).origin;
  } catch {
    return fallback;
  }
}

function buildCsp(opts: { allowFraming: boolean }): string {
  // Dominios reales que usa el código (ver ORBYX_PRELAUNCH_DIAGNOSTIC.md, punto 4):
  // backend (lib/backend-url.ts), Supabase (cliente + Realtime wss), Turnstile,
  // Google Maps embebido (iframes) e imágenes externas (Unsplash, Storage).
  const backend = originOf(process.env.NEXT_PUBLIC_BACKEND_URL, "https://api.orbyx.cl");
  const supabase = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://*.supabase.co");
  const supabaseWs = supabase.replace(/^https:/, "wss:");

  const connect = [
    "'self'",
    backend,
    "https://api.orbyx.cl",
    supabase,
    supabaseWs,
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://challenges.cloudflare.com",
  ];

  const directives: string[] = [
    "default-src 'self'",
    // 'unsafe-inline' es inevitable: script en línea en layout.tsx y los de Next.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${[...new Set(connect)].join(" ")}`,
    "frame-src https://challenges.cloudflare.com https://maps.google.com https://www.google.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (!opts.allowFraming) directives.push("frame-ancestors 'none'");

  return directives.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    const reserved = getReservedSegments();
    const reservedAlternation = reserved.join("|");

    // Cabeceras para TODAS las rutas.
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
    ];

    // Páginas que NO se pueden embeber.
    const framingDenied = [
      { key: "Content-Security-Policy-Report-Only", value: buildCsp({ allowFraming: false }) },
      { key: "X-Frame-Options", value: "DENY" },
    ];

    return [
      { source: "/:path*", headers: common },

      // Raíz y cualquier ruta de 2+ segmentos (incluye /{slug}/opinar,
      // /dashboard/..., /api/..., /cancel/{id}, /invite/{token}).
      { source: "/", headers: framingDenied },
      { source: "/:first/:rest+", headers: framingDenied },
      // Rutas fijas de un solo segmento (login, signup, planes, ...).
      { source: `/:fixed(${reservedAlternation})`, headers: framingDenied },

      // Página pública de reserva /{slug}: un segmento que no es ruta fija
      // ni archivo (sin punto). Embebible.
      {
        source: `/:slug((?!(?:${reservedAlternation})$)[^/.]+)`,
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: buildCsp({ allowFraming: true }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
