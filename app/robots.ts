import type { MetadataRoute } from "next";

const SITE_URL = "https://www.orbyx.cl";

// Se permite la landing, planes, legales y las páginas públicas de reserva
// (/{slug}). Se bloquea todo lo que es privado, transaccional o de sesión.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/api",
        "/login",
        "/signup",
        "/invite",
        "/completar-registro",
        "/checkout",
        "/checkout-premium",
        "/actualizar-password",
        "/recuperar-password",
        "/auth",
        "/onboarding",
        "/welcome",
        "/pago-exitoso",
        "/cancel",
        "/desuscribir",
        "/*/opinar",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
