/**
 * Supabase client for BROWSER code (client components).
 *
 * Only used for auth session awareness on the client. All data writes go
 * through our API routes instead, so the browser never needs database
 * write permissions.
 */
import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
