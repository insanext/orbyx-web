import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Red de seguridad: ninguna llamada del middleware (refresh de token,
// descarga de JWKS) puede esperar más que esto. Vercel corta el middleware
// con 504 MIDDLEWARE_INVOCATION_TIMEOUT si Supabase se degrada.
const AUTH_TIMEOUT_MS = 3000;

/** Header interno con el pathname (mismo valor que lib/dashboard-access.ts) para que el template server-side sepa en qué ruta está. */
const PATHNAME_HEADER = "x-orbyx-pathname";

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const timeout = AbortSignal.timeout(AUTH_TIMEOUT_MS);
  const signal =
    init?.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeout])
      : timeout;
  // Nada de auth debe quedar en la Data Cache de Next.js.
  return fetch(input, { ...init, signal, cache: "no-store" });
}

/**
 * Middleware de autenticación Orbyx.
 *
 * Solo responde "¿hay sesión válida?" con auth.getClaims(), que verifica la
 * firma del JWT localmente (JWKS cacheado, JWT Signing Keys asimétricas) sin
 * pegarle a Supabase en cada request. NO hace queries a tablas: la validación
 * de tenant, pertenencia y billing vive en app/dashboard/[slug]/template.tsx
 * (lib/dashboard-access.ts).
 *
 * También refresca el token de sesión cuando está por expirar, propagando las
 * cookies actualizadas.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  function nextResponse() {
    const headers = new Headers(request.headers);
    headers.set(PATHNAME_HEADER, pathname);
    return NextResponse.next({ request: { headers } });
  }

  let supabaseResponse = nextResponse();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = nextResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
    global: { fetch: fetchWithTimeout },
  });

  // IMPORTANTE: getClaims() y no getSession() (no valida la firma).
  let hasSession = false;
  let timedOut = false;
  try {
    const result = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), AUTH_TIMEOUT_MS + 500)
      ),
    ]);
    if (result === "timeout") {
      timedOut = true;
    } else if (result.error && isAuthRetryableFetchError(result.error)) {
      timedOut = true;
    } else {
      hasSession = Boolean(result.data?.claims?.sub);
    }
  } catch {
    timedOut = true;
  }

  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin") && !isAdminLogin;
  const isDashboard = pathname.startsWith("/dashboard");

  if (!hasSession && (isDashboard || isAdminArea)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.search = "";
    if (isAdminArea) {
      loginUrl.pathname = "/admin/login";
    } else {
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    if (timedOut && isDashboard) loginUrl.searchParams.set("reason", "timeout");
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return supabaseResponse;
}

export const config = {
  // /login queda fuera a propósito: el formulario ya resuelve solo la sesión
  // activa (resolveTenantDestination en app/login/page.tsx) y no debe poder
  // caerse por el middleware.
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
