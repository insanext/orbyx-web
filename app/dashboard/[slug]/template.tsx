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
 * Se usa template y no layout porque el layout es un client component. Valida tenant por slug,
 * pertenencia del usuario y estado de suscripción/trial.
 */
export default async function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Los templates NO reciben `params` (solo children, ver docs de Next):
  // el middleware pasa el pathname en un header y de ahí sale el slug.
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? "";
  const slug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
  if (!slug) redirect("/login?error=no_access");

  const access = await checkDashboardAccess(slug, pathname);

  if (access.kind === "redirect") redirect(access.to);
  if (access.kind === "error") return <AccessCheckError />;

  return <>{children}</>;
}
