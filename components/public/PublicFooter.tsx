"use client";

import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { usePublicTheme } from "@/lib/public-theme";

export function PublicFooter() {
  const { theme } = usePublicTheme();
  const markSrc = theme === "dark" ? "/orbyx-mark-dark.png" : "/orbyx-mark.png";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--pub-border)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
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
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-[var(--pub-border)] pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-1.5 text-sm text-[var(--pub-text-muted)] sm:items-start">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pub-text-faint)]">
              Contáctenos
            </p>
            <a href="tel:+56961188890" className="transition hover:text-[var(--pub-text)]">
              +56 9 6118 8890
            </a>
            <a href="mailto:contacto@orbyx.cl" className="transition hover:text-[var(--pub-text)]">
              contacto@orbyx.cl
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* TODO: actualizar con URL real de Instagram cuando la cuenta exista */}
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pub-border)] text-[var(--pub-text-muted)] transition hover:text-[var(--pub-text)]"
            >
              <Instagram size={16} />
            </a>
            {/* TODO: actualizar con URL real de Facebook cuando la cuenta exista */}
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pub-border)] text-[var(--pub-text-muted)] transition hover:text-[var(--pub-text)]"
            >
              <Facebook size={16} />
            </a>
          </div>

          <p className="text-center text-xs text-[var(--pub-text-faint)] sm:text-right">
            © {year} Orbyx Soluciones Digitales SpA.
            <br className="sm:hidden" /> Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
