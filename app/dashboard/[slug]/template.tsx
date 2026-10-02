import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  PATHNAME_HEADER,
  checkDashboardAccess,
} from "@/lib/dashboard-access";
import AccessCheckError from "@/components/AccessCheckError";

/**
 * Guard server-side del dashboard (antes vivía en middleware.ts).
 *
 * Se usa template y no layout porque el template se re-ejecuta en cada
 * navegación, igual que el middleware: entrar por URL directa a otra sección
 * con el trial vencido sigue bloqueándose. Valida tenant por slug,
 * pertenencia del usuario y estado de suscripción/trial.
 */
export default async function DashboardTemplate({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? "";

  const access = await checkDashboardAccess(slug, pathname);

  if (access.kind === "redirect") redirect(access.to);
  if (access.kind === "error") return <AccessCheckError />;

  return <>{children}</>;
}
