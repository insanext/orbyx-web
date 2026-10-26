// Plantillas visuales de la página pública de reservas (/{slug}).
//
// IMPORTANTE: la lista de ids debe coincidir con PUBLIC_TEMPLATE_IDS en
// server.js (el backend valida contra esa lista al guardar). Al agregar una
// plantilla nueva hay que sumarla en AMBOS lados.
//
// Cómo funciona: la página pública usa clases Tailwind v4 fijas (indigo-*,
// sky-*, rounded-*, ...). Tailwind v4 compila esas utilidades como
// `var(--color-indigo-600)`, `var(--radius-xl)`, etc. Una plantilla solo
// sobrescribe esas variables CSS (más unas pocas `--pt-*` para los colores que
// estaban escritos en hex dentro de page.tsx). La plantilla "clasica" NO
// sobrescribe nada: es exactamente la página de siempre.
//
// Para agregar una plantilla nueva (ver CLAUDE.md, "Public page templates"):
//   1. Sumar una entrada a PUBLIC_TEMPLATES (acá).
//   2. Sumar el id a PUBLIC_TEMPLATE_IDS (server.js).
// Nada más: ni la página pública ni el selector del dashboard cambian.

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type ColorScale = Record<ColorShade, string>;

export type PublicTemplate = {
  id: string;
  name: string;
  description: string;
  /** 3 colores para la muestra de la tarjeta del selector (fondo, primario, texto). */
  swatch: [string, string, string];
  /** Reemplaza la escala `indigo-*` (el color de marca de la página). */
  primary?: ColorScale;
  /** Reemplaza la escala `sky-*` (acentos secundarios: hover de días/horas, degradados). */
  secondary?: ColorScale;
  /** Fondos que estaban en hex dentro de page.tsx. Si falta, se deriva de `primary`. */
  surface?: { pageFrom: string; pageTo: string; soft?: string; selected?: string };
  /** Bordes redondeados (solo afecta rounded-sm…3xl; `rounded-none` y `rounded-full` no cambian). */
  radius?: Partial<Record<"sm" | "md" | "lg" | "xl" | "2xl" | "3xl", string>>;
  /** Tipografía del <body>. Solo fuentes ya cargadas en app/layout.tsx (variables de next/font). */
  fontFamily?: string;
  /** Escape: variables CSS adicionales tal cual. */
  vars?: Record<string, string>;
};

export const DEFAULT_PUBLIC_TEMPLATE_ID = "clasica";

// Esmeralda: primario verde azulado. 500-950 oscurecidos a propósito para que
// botones (texto blanco sobre `600`) y textos sobre blanco cumplan contraste AA.
const TEAL: ColorScale = {
  50: "#f0fdfa",
  100: "#ccfbf1",
  200: "#99f6e4",
  300: "#5eead4",
  400: "#14b8a6",
  500: "#0d9488",
  600: "#0f766e",
  700: "#115e59",
  800: "#134e4a",
  900: "#0f3d3a",
  950: "#042f2e",
};

const TEAL_SECONDARY: ColorScale = {
  50: "#f0fdfa",
  100: "#ccfbf1",
  200: "#99f6e4",
  300: "#5eead4",
  400: "#2dd4bf",
  500: "#14b8a6",
  600: "#0d9488",
  700: "#0f766e",
  800: "#115e59",
  900: "#134e4a",
  950: "#042f2e",
};

// Grafito: primario casi negro (escala de zinc).
const GRAPHITE: ColorScale = {
  50: "#f4f4f5",
  100: "#e4e4e7",
  200: "#d4d4d8",
  300: "#a1a1aa",
  400: "#71717a",
  500: "#52525b",
  600: "#27272a",
  700: "#111113",
  800: "#0b0b0d",
  900: "#09090b",
  950: "#000000",
};

const GRAPHITE_SECONDARY: ColorScale = {
  50: "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
};


// --- Plantillas agregadas 2026-10-26. Mismo criterio: `600` con contraste AA
// para texto blanco (botones) y 700-950 legibles sobre blanco.
const ROSE: ColorScale = {
  50: "#fff1f5",
  100: "#ffe4ec",
  200: "#fecdd9",
  300: "#fda4bc",
  400: "#f472a0",
  500: "#e1457f",
  600: "#be185d",
  700: "#9d174d",
  800: "#831843",
  900: "#6b1238",
  950: "#4a0a26",
};

const OCEAN: ColorScale = {
  50: "#eff8ff",
  100: "#dbeefe",
  200: "#bfe1fd",
  300: "#93cdfb",
  400: "#5aaef6",
  500: "#2f8ce8",
  600: "#1d6fcc",
  700: "#1a59a6",
  800: "#1b4b86",
  900: "#1b3f6e",
  950: "#132849",
};

const TERRACOTTA: ColorScale = {
  50: "#fdf6f3",
  100: "#fbe9e2",
  200: "#f6d0c2",
  300: "#eeae97",
  400: "#e2826a",
  500: "#d4623f",
  600: "#b5482a",
  700: "#963a23",
  800: "#7a3221",
  900: "#642c1f",
  950: "#36140c",
};

const GOLD: ColorScale = {
  50: "#fbf8f1",
  100: "#f5eedb",
  200: "#ebdcb4",
  300: "#dec386",
  400: "#d0a85d",
  500: "#b98d3f",
  600: "#8f6a28",
  700: "#745522",
  800: "#5f4621",
  900: "#4f3b1f",
  950: "#2d200f",
};

const FOREST: ColorScale = {
  50: "#f3f8f3",
  100: "#e2eee2",
  200: "#c6dcc7",
  300: "#9dc29f",
  400: "#6fa173",
  500: "#4e8453",
  600: "#3b6a40",
  700: "#315536",
  800: "#29452d",
  900: "#233a27",
  950: "#102013",
};

export const PUBLIC_TEMPLATES: PublicTemplate[] = [
  {
    id: "clasica",
    name: "Clásica",
    description: "El diseño de siempre: índigo, limpio y sobrio.",
    swatch: ["#F1EFFC", "#4F46E5", "#0F172A"],
  },
  {
    id: "esmeralda",
    name: "Esmeralda",
    description: "Verde azulado, fresco y tranquilo.",
    swatch: ["#F0FDFA", "#0F766E", "#134E4A"],
    primary: TEAL,
    secondary: TEAL_SECONDARY,
    surface: { pageFrom: "#F6FDFB", pageTo: "#E3F6F2", soft: "#DDF3EE", selected: "#D3F0EA" },
    fontFamily: "var(--font-dm-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "grafito",
    name: "Grafito",
    description: "Casi negro con bordes más suaves. Elegante y neutro.",
    swatch: ["#F4F4F5", "#27272A", "#09090B"],
    primary: GRAPHITE,
    secondary: GRAPHITE_SECONDARY,
    surface: { pageFrom: "#FAFAFA", pageTo: "#ECECEE", soft: "#E8E8EB", selected: "#E4E4E7" },
    radius: { lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "rosa",
    name: "Rosa",
    description: "Rosado suave y femenino. Ideal para estética, uñas y belleza.",
    swatch: ["#FFF1F5", "#BE185D", "#4A0A26"],
    primary: ROSE,
    secondary: ROSE,
    surface: { pageFrom: "#FFF8FA", pageTo: "#FCE7EF", soft: "#FCE4EC", selected: "#FBD5E3" },
    radius: { lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
    fontFamily: "var(--font-dm-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "oceano",
    name: "Océano",
    description: "Azul profundo y confiable. Para salud, clínicas y servicios.",
    swatch: ["#EFF8FF", "#1D6FCC", "#132849"],
    primary: OCEAN,
    secondary: OCEAN,
    surface: { pageFrom: "#F7FBFF", pageTo: "#E3F0FC", soft: "#DDEDFC", selected: "#D3E7FB" },
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "terracota",
    name: "Terracota",
    description: "Tierra cálida y cercana. Para spa, masajes y bienestar.",
    swatch: ["#FDF6F3", "#B5482A", "#36140C"],
    primary: TERRACOTTA,
    secondary: TERRACOTTA,
    surface: { pageFrom: "#FFFAF7", pageTo: "#F8E9E1", soft: "#F7E4DA", selected: "#F3D8CB" },
    radius: { lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
    fontFamily: "var(--font-dm-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "dorado",
    name: "Dorado",
    description: "Arena y dorado. Elegante y premium.",
    swatch: ["#FBF8F1", "#8F6A28", "#2D200F"],
    primary: GOLD,
    secondary: GOLD,
    surface: { pageFrom: "#FDFBF6", pageTo: "#F3ECDD", soft: "#F2EADA", selected: "#ECE0C6" },
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
  {
    id: "bosque",
    name: "Bosque",
    description: "Verde natural y sereno. Para terapias, yoga y naturaleza.",
    swatch: ["#F3F8F3", "#3B6A40", "#102013"],
    primary: FOREST,
    secondary: FOREST,
    surface: { pageFrom: "#F8FBF8", pageTo: "#E6EFE6", soft: "#E2EDE2", selected: "#D6E6D7" },
    fontFamily: "var(--font-dm-sans), Arial, Helvetica, sans-serif",
  },
];

export function isKnownPublicTemplate(id: unknown): id is string {
  return typeof id === "string" && PUBLIC_TEMPLATES.some((t) => t.id === id);
}

/** Devuelve la plantilla pedida o "clasica" si el id no existe. */
export function getPublicTemplate(id?: string | null): PublicTemplate {
  return (
    PUBLIC_TEMPLATES.find((t) => t.id === id) ||
    PUBLIC_TEMPLATES.find((t) => t.id === DEFAULT_PUBLIC_TEMPLATE_ID) ||
    PUBLIC_TEMPLATES[0]
  );
}

function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function scaleVars(name: string, scale: ColorScale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [shade, value] of Object.entries(scale)) out[`--color-${name}-${shade}`] = value;
  return out;
}

/**
 * Variables CSS que aplica una plantilla sobre <html>. "clasica" (o cualquiera
 * sin tokens) devuelve {}: sin overrides = cero cambio visual.
 */
export function getPublicTemplateVars(template: PublicTemplate): Record<string, string> {
  const vars: Record<string, string> = {};

  if (template.primary) {
    const p = template.primary;
    Object.assign(vars, scaleVars("indigo", p));
    // violet-* aparece en 3 íconos decorativos de la página: sigue al primario.
    Object.assign(vars, scaleVars("violet", p));
    // Colores que page.tsx tenía en hex (calendario semanal, sombras con brillo).
    vars["--pt-cal-nav"] = p[700];
    vars["--pt-cal-hover-bg"] = p[50];
    vars["--pt-cal-hover-text"] = p[800];
    vars["--pt-cal-now-bg"] = p[100];
    vars["--pt-cal-active"] = p[600];
    vars["--pt-cat-from"] = p[50];
    vars["--pt-cat-mid"] = p[50];
    const glow = hexToRgbTriplet(p[600]);
    if (glow) vars["--pt-glow-rgb"] = glow;
    vars["--pt-soft-bg"] = p[100];
    vars["--pt-selected-bg"] = p[100];
  }
  if (template.secondary) Object.assign(vars, scaleVars("sky", template.secondary));

  if (template.surface) {
    vars["--pt-bg-from"] = template.surface.pageFrom;
    vars["--pt-bg-to"] = template.surface.pageTo;
    if (template.surface.soft) vars["--pt-soft-bg"] = template.surface.soft;
    if (template.surface.selected) vars["--pt-selected-bg"] = template.surface.selected;
  }
  if (template.radius) {
    for (const [key, value] of Object.entries(template.radius)) vars[`--radius-${key}`] = value;
  }
  if (template.vars) Object.assign(vars, template.vars);
  return vars;
}

/**
 * Aplica la plantilla a la página: pone `data-public-template` y las variables
 * en <html> (así también las toman los portales bajo <body>: modales, el
 * dropdown de Select, etc.) y la tipografía en <body>. Devuelve la función que
 * lo deshace (al salir de /{slug} no debe quedar nada puesto).
 */
export function applyPublicTemplate(id: string): () => void {
  if (typeof document === "undefined") return () => {};
  const template = getPublicTemplate(id);
  const vars = getPublicTemplateVars(template);
  const root = document.documentElement;
  const body = document.body;
  const names = Object.keys(vars);

  if (names.length === 0 && !template.fontFamily) return () => {};

  root.setAttribute("data-public-template", template.id);
  for (const name of names) root.style.setProperty(name, vars[name]);
  const previousFont = body.style.fontFamily;
  if (template.fontFamily) body.style.fontFamily = template.fontFamily;

  return () => {
    root.removeAttribute("data-public-template");
    for (const name of names) root.style.removeProperty(name);
    if (template.fontFamily) body.style.fontFamily = previousFont;
  };
}
