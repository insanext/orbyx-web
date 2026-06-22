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

  // Si accede a /admin/** (excepto /admin/login) sin sesión → redirect a /admin/login
  if (!user && pathname.startsWith("/admin") && pathname !== "/admin/login" && pathname !== "/admin/setup-mfa") {
    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = "/admin/login";
    return NextResponse.redirect(adminLoginUrl);
  }

  // Si ya tiene sesión y accede a /login → redirect al dashboard
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
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
