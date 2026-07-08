/**
 * Supabase ADMIN client — uses the secret service-role key.
 *
 * ⚠️  SERVER-ONLY. This key bypasses all row-level security. It must never
 * be imported from a client component (Next.js will refuse anyway because
 * the env var isn't prefixed with NEXT_PUBLIC_, so it simply doesn't exist
 * in the browser bundle).
 *
 * All writes in this app flow through API routes that use this client
 * AFTER checking permissions in plain, readable code (see app/api/*).
 * That keeps the security story in one obvious place instead of scattered
 * across SQL policies.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
