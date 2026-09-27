import type { MetadataRoute } from "next";

// PWA instalable del dashboard (Fase 1 app móvil). Next sirve esto en
// /manifest.webmanifest y agrega el <link rel="manifest"> solo.
// start_url = /login: el middleware ya redirige a una sesión activa
// directo a su /dashboard/{slug}, así que abrir la app instalada cae en el
// panel sin pasar por el formulario si el usuario sigue logueado.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/login",
    // short_name es el texto bajo el ícono en la pantalla de inicio
    // (Android e iOS); name se usa en el diálogo de instalación y el splash.
    name: "Agenda Orbyx",
    short_name: "Agenda Orbyx",
    description: "Agenda y reservas para tu negocio",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "es-CL",
    background_color: "#ffffff",
    theme_color: "#0B1428",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
