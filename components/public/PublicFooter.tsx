"use client";

import Link from "next/link";
import { usePublicTheme } from "@/lib/public-theme";

export function PublicFooter() {
  const { theme } = usePublicTheme();
  const markSrc = theme === "dark" ? "/orbyx-mark-dark.png" : "/orbyx-mark.png";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--pub-border)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-6 sm:flex-row">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={markSrc} alt="Orbyx" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-[var(--pub-text)]">Orbyx</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--pub-text-muted)]">
          <Link href="/#funciones" className="transition hover:text-[var(--pub-text)]">Funciones</Link>
          <Link href="/planes" className="transition hover:text-[var(--pub-text)]">Planes</Link>
          <Link href="/nosotros" className="transition hover:text-[var(--pub-text)]">Nosotros</Link>
          <Link href="/login" className="transition hover:text-[var(--pub-text)]">Iniciar sesión</Link>
        </nav>

        <p className="text-xs text-[var(--pub-text-faint)]">© {year} Orbyx. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
