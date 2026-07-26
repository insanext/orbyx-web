import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Middleware de autenticación Orbyx.
 *
 * Protege /dashboard/** — redirige a /login si no hay sesión activa.
 * No toca rutas públicas: /[slug], /cancel, /api/**, /onboarding, /planes, /checkout.
 *
 * El middleware también refresca el token de sesión automáticamente
 * cuando está próximo a expirar, propagando las cookies actualizadas.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verifica sesión activa.
  // IMPORTANTE: no usar getSession() aquí porque puede estar desactualizada.
  // getUser() verifica contra Supabase cada vez.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Si accede a /dashboard/** sin sesión → redirect a /login
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión activa, /dashboard/{slug}/** requiere además que el slug de
  // la URL sea un tenant real Y que el usuario tenga una fila activa en
  // tenant_users para ESE tenant. Sin esto, cualquier usuario logueado
  // (dueño de otro negocio, o de ninguno) podía visitar
  // /dashboard/{cualquier-slug} y ver el shell completo del panel sin
  // tener acceso real a ese negocio.
  if (user && pathname.startsWith("/dashboard/")) {
    const dashboardSlug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];

    if (dashboardSlug) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", dashboardSlug)
        .eq("is_active", true)
        .maybeSingle();

      let hasAccess = false;

      if (tenant?.id) {
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        hasAccess = Boolean(tenantUser);
      }

      // Mismo mensaje genérico exista o no el tenant, para no revelar cuál
      // de los dos casos es (evita confirmar/negar la existencia de un
      // slug ajeno). Sin redirectTo: si el usuario sigue logueado, /login
      // ya lo re-redirige solo a SU propio dashboard (resolveTenantDestination
      // en app/login/page.tsx) — no tiene sentido devolverlo al slug que
      // se le acaba de negar.
      if (!hasAccess) {
        const deniedUrl = request.nextUrl.clone();
        deniedUrl.pathname = "/login";
        deniedUrl.search = "";
        deniedUrl.searchParams.set("error", "no_access");
        return NextResponse.redirect(deniedUrl);
      }
    }
  }

  // Si accede a /admin/** (excepto /admin/login) sin sesión → redirect a /admin/login
  if (!user && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = "/admin/login";
    return NextResponse.redirect(adminLoginUrl);
  }

  // Si ya tiene sesión y accede a /login → redirect al dashboard del tenant
  if (user && pathname === "/login") {
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (tenantUser) {
      // Mismo criterio que el chequeo de ownership de /dashboard/{slug}/**
      // más abajo (is_active=true en tenants) — antes este bloque no lo
      // filtraba, así que un tenant_users activo apuntando a un tenant
      // inactivo se resolvía igual acá y el otro chequeo lo rechazaba,
      // generando un loop de redirección entre /login y /dashboard/{slug}.
      const { data: tenant } = await supabase
        .from("tenants")
        .select("slug, business_category")
        .eq("id", tenantUser.tenant_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!tenant) {
        // tenant_users activo sin un tenant activo correspondiente: dato
        // inconsistente (membresía huérfana), mismo patrón visto con
        // barberiaprueba. No se resuelve acá — cae al fallback de abajo
        // y se muestra el login normal — pero se deja registrado para
        // poder encontrar estas membresías huérfanas más adelante.
        console.warn(
          `middleware /login: tenant_users activo (user_id=${user.id}) apunta a tenants.id=${tenantUser.tenant_id} inexistente o inactivo`
        );
      }

      if (tenant?.slug) {
        const ONBOARDING_PENDING = new Set(["generic", "generico"]);
        const isPending = !tenant.business_category || ONBOARDING_PENDING.has(tenant.business_category);

        if (isPending) {
          const onboardingUrl = request.nextUrl.clone();
          onboardingUrl.pathname = "/onboarding";
          onboardingUrl.search = "";
          onboardingUrl.searchParams.set("tenant_id", tenantUser.tenant_id);
          return NextResponse.redirect(onboardingUrl);
        }

        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = `/dashboard/${tenant.slug}`;
        dashboardUrl.search = "";
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // Si no se pudo resolver el tenant, dejar que el login se muestre normalmente
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Solo aplica el middleware a:
     * - /login
     * - /dashboard y cualquier subruta
     *
     * Excluye explícitamente:
     * - Archivos estáticos (_next/static, _next/image, favicon, etc.)
     * - /api/** (no bloqueamos API routes de Next.js)
     * - / (raíz)
     * - /[slug] (booking público)
     * - /cancel/**
     * - /onboarding
     * - /planes/**
     * - /checkout
     */
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
