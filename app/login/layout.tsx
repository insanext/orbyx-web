import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Orbyx",
  description: "Accede a tu panel de negocio Orbyx",
};

/**
 * Layout mínimo para /login.
 * Aislado del dashboard — no tiene sidebar ni header de negocio.
 * No repite <html>/<body> porque el root layout en app/layout.tsx ya los provee.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
