import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente Supabase para uso en componentes client-side ("use client").
 * Maneja la sesión via cookies de forma automática con @supabase/ssr.
 *
 * Uso:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
