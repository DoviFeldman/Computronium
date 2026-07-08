/**
 * Supabase client for SERVER code (server components, API routes).
 *
 * This client reads the logged-in user's session from cookies, so
 * `supabase.auth.getUser()` tells you who is making the request.
 * It uses the public "anon" key, meaning it can only do what the
 * row-level-security policies in supabase/schema.sql allow (mostly: read).
 *
 * For privileged writes (creating posts, editing, admin actions) the API
 * routes use lib/supabase/admin.ts instead, after checking permissions in
 * code.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore — the middleware refreshes sessions instead.
        }
      },
    },
  });
}
