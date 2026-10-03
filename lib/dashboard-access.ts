import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Validaciones de acceso al dashboard que antes vivían en middleware.ts.
 * Se ejecutan en app/dashboard/[slug]/template.tsx (server component), así
 * una caída o lentitud de Supabase muestra una pantalla de error con
 * "Reintentar" en vez de tumbar la ruta con un 504.
 *
 * Mismo comportamiento de redirects que tenía el middleware.
 */

export const PATHNAME_HEADER = "x-orbyx-pathname";
export const ACCESS_QUERY_TIMEOUT_MS = 5000;

export type DashboardAccessResult =
  | { kind: "ok" }
  | { kind: "redirect"; to: string }
  | { kind: "error" };

async function createRequestScopedClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // El refresh de cookies lo hace el middleware; acá no se escribe nada.
        setAll() {},
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.timeout(ACCESS_QUERY_TIMEOUT_MS),
            cache: "no-store",
          }),
      },
    }
  );
}

async function runChecks(slug: string, pathname: string): Promise<DashboardAccessResult> {
  const supabase = await createRequestScopedClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) return { kind: "error" };
  const userId = claimsData?.claims?.sub;
  // El middleware ya garantiza sesión; si llegó acá sin ella, a login.
  if (!userId) return { kind: "redirect", to: "/login" };

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, is_trial, trial_ends_at, billing_cycle_end, paused_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (tenantErr) return { kind: "error" };

  let hasAccess = false;
  if (tenant?.id) {
    const { data: tenantUser, error: tuErr } = await supabase
      .from("tenant_users")
      .select("tenant_id, user_id, role, is_active")
      .eq("tenant_id", tenant.id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (tuErr) return { kind: "error" };
    hasAccess = Boolean(tenantUser);
  }

  // Mismo mensaje genérico exista o no el tenant, para no revelar si un slug
  // ajeno existe. Sin redirectTo: /login re-redirige solo al dashboard propio.
  if (!hasAccess || !tenant) {
    return { kind: "redirect", to: "/login?error=no_access" };
  }

  // Modo limitado: se bloquea todo /dashboard/{slug}/** EXCEPTO /billing para
  // que el dueño pueda pagar o inscribir tarjeta.
  const isBillingPath =
    pathname === `/dashboard/${slug}/billing` ||
    pathname.startsWith(`/dashboard/${slug}/billing/`);
  if (isBillingPath) return { kind: "ok" };

  const { data: latestSub, error: subErr } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr) return { kind: "error" };

  const hasActiveSubscription = latestSub?.status === "active";
  // 'trialing': tarjeta registrada mid-trial, primer cobro ya programado en
  // Flow para cuando termine el trial — no bloquea mientras el trial siga.
  const isTrialingInFlow = latestSub?.status === "trialing";
  const now = new Date();
  const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const billingCycleEnd = tenant.billing_cycle_end ? new Date(tenant.billing_cycle_end) : null;

  const isPaused = Boolean(tenant.paused_at);
  // Misma fórmula que computeBillingAccessState en server.js (auditoría
  // 2026-09-30, sesión 3) — mantener ambas iguales:
  //   - 'trialing' no cuenta como trial activo (ya inscribió tarjeta).
  //   - El fin de trial solo bloquea a quien nunca pagó (is_trial !== false);
  //     quien ya pagó y cancela conserva acceso hasta billing_cycle_end.
  //   - Cobro rechazado ('error'): 3 días de gracia sobre el corte.
  const PAYMENT_FAILED_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
  const paymentFailed = latestSub?.status === "error";
  const hasPaidBefore = tenant.is_trial === false;
  const trialActive = Boolean(
    !isPaused && trialEndsAt && now < trialEndsAt && !hasActiveSubscription && !isTrialingInFlow
  );
  const awaitingPayment = !hasActiveSubscription && !trialActive && !isTrialingInFlow;
  const graceMs = paymentFailed ? PAYMENT_FAILED_GRACE_MS : 0;
  // trial_ends_at y billing_cycle_end son columnas independientes (el admin
  // puede ajustar trial_ends_at sin tocar billing_cycle_end).
  const trialExpired = Boolean(
    !isPaused &&
      awaitingPayment &&
      !hasPaidBefore &&
      trialEndsAt &&
      now.getTime() >= trialEndsAt.getTime() + graceMs
  );
  // Quien nunca pagó y tiene trial se rige solo por el fin del trial.
  const governedByTrial = Boolean(trialEndsAt && !hasPaidBefore);
  const blocked =
    isPaused ||
    trialExpired ||
    Boolean(
      awaitingPayment &&
        !governedByTrial &&
        billingCycleEnd &&
        now.getTime() >= billingCycleEnd.getTime() + graceMs
    );

  if (blocked) return { kind: "redirect", to: `/dashboard/${slug}/billing` };
  return { kind: "ok" };
}

export async function checkDashboardAccess(
  slug: string,
  pathname: string
): Promise<DashboardAccessResult> {
  try {
    return await Promise.race([
      runChecks(slug, pathname),
      new Promise<DashboardAccessResult>((resolve) =>
        setTimeout(() => resolve({ kind: "error" }), ACCESS_QUERY_TIMEOUT_MS + 500)
      ),
    ]);
  } catch (err) {
    console.error("[dashboard-access] fallo al validar acceso:", err);
    return { kind: "error" };
  }
}
