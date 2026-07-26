"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";

// Tema de las páginas públicas de marketing (landing, precios). Completamente
// aparte del tema del dashboard (orbyx_active_branch_*, data-theme
// clasico/nocturno en lib/use-theme.ts) — su propia key de storage, su
// propio atributo, sin tocar <html>/<body> para no interferir con nada más.
export type PublicTheme = "light" | "dark";

const STORAGE_KEY = "orbyx_public_theme";

const PublicThemeContext = createContext<{
  theme: PublicTheme;
  toggleTheme: () => void;
} | null>(null);

function resolveInitialTheme(): PublicTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage inaccesible (modo privado, etc.) — sigue al fallback de sistema
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Script bloqueante que fija el atributo antes del primer paint, para evitar
// el flash de tema incorrecto mientras React hidrata.
const BOOTSTRAP_SCRIPT = `(function(){try{var s=window.localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var el=document.getElementById("orbyx-public-theme-root");if(el)el.setAttribute("data-public-theme",t);}catch(e){}})();`;

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PublicTheme>("dark");

  useEffect(() => {
    setTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage inaccesible — la preferencia simplemente no persiste
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <PublicThemeContext.Provider value={{ theme, toggleTheme }}>
      <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />
      <div
        id="orbyx-public-theme-root"
        className="orbyx-public"
        data-public-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const ctx = useContext(PublicThemeContext);
  if (!ctx) {
    throw new Error("usePublicTheme debe usarse dentro de PublicThemeProvider");
  }
  return ctx;
}

export function PublicThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = usePublicTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] text-[var(--pub-text)] transition hover:border-[var(--pub-accent-soft-border)] hover:text-[var(--pub-accent)] ${className}`}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
