"use client";

import Link from "next/link";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

export default function NotFound() {
  return (
    <PublicThemeProvider>
      <main
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
        className="min-h-screen bg-[var(--pub-bg)] text-[var(--pub-text)]"
      >
        <div className="mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 lg:px-10">
          <PublicHeader />
        </div>

        <section className="px-4 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold text-[var(--pub-accent)]">Error 404</p>
            <h1
              style={serif}
              className="mt-3 text-[36px] leading-[1.1] tracking-[-0.02em] text-[var(--pub-text)] sm:text-[46px]"
            >
              No encontramos esta página
            </h1>
            <p className="mt-4 text-base text-[var(--pub-text-muted)]">
              El enlace puede estar mal escrito o la página ya no existe.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--pub-accent)] px-7 text-base font-bold text-[var(--pub-accent-text)] shadow-[0_8px_28px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Volver al inicio
            </Link>
          </div>
        </section>

        <PublicFooter />
      </main>
    </PublicThemeProvider>
  );
}
