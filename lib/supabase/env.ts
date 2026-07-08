/**
 * Reads the Supabase environment variables with safe fallbacks.
 *
 * The fallbacks let `next build` succeed even before you've set up your
 * .env.local — the app will render, but any page that needs the database
 * will show empty data until real values are provided. That's on purpose:
 * it makes the very first deploy painless.
 */

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
}

export function supabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";
}

/** True once real env vars are configured. */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
