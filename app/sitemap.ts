import type { MetadataRoute } from "next";

const SITE_URL = "https://www.orbyx.cl";

// Solo páginas públicas fijas. Los slugs de negocios (/{slug}) no se listan.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/planes", priority: 0.8 },
    { path: "/planes/comparar", priority: 0.6 },
    { path: "/nosotros", priority: 0.5 },
    { path: "/terminos", priority: 0.3 },
    { path: "/privacidad", priority: 0.3 },
  ];

  return paths.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    priority,
  }));
}
