"use client";

import Link from "next/link";
import { usePublicTheme, PublicThemeToggle } from "@/lib/public-theme";

// Header compartido entre todas las páginas públicas de marketing
// (landing, nosotros, y a futuro precios). El ícono de marca cambia según
// el tema: el mark a color no se lee bien sobre fondo oscuro tal cual, así
// que en modo oscuro se usa una variante recoloreada (mismo dibujo, mismos
// archivos generados a partir de public/orbyx-logo.png).
export function PublicHeader() {
  const { theme } = usePublicTheme();
  const markSrc = theme === "dark" ? "/orbyx-mark-dark.png" : "/orbyx-mark.png";

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2.5">
        <img src={markSrc} alt="Orbyx" className="h-9 w-9" />
        <span className="text-2xl font-bold tracking-tight text-[var(--pub-text)]">Orbyx</span>
      </Link>

      <nav className="hidden items-center gap-9 text-sm font-medium text-[var(--pub-text-muted)] lg:flex">
        <Link href="/#funciones" className="transition hover:text-[var(--pub-text)]">Funciones</Link>
        <Link href="/nosotros" className="transition hover:text-[var(--pub-text)]">Nosotros</Link>
        <Link href="/#casos" className="transition hover:text-[var(--pub-text)]">Casos de uso</Link>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <PublicThemeToggle />
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--pub-border)] px-3 text-xs font-medium text-[var(--pub-text)] transition hover:border-[var(--pub-accent-soft-border)] hover:bg-[var(--pub-bg-soft)] sm:h-12 sm:px-6 sm:text-sm"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup?plan=starter"
          className="hidden h-10 items-center justify-center rounded-lg bg-[var(--pub-accent)] px-5 text-sm font-bold text-[var(--pub-accent-text)] shadow-[0_0_20px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110 sm:inline-flex sm:h-12"
        >
          Probar gratis
        </Link>
      </div>
    </header>
  );
}
