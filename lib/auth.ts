/**
 * Auth helpers — username + password accounts with NO email required.
 *
 * HOW IT WORKS
 *   Supabase Auth technically wants an email address, so we synthesize a
 *   fake one from the username: "robotkid" → "robotkid@computronium.local".
 *   That address is never emailed (it can't be — the domain isn't real),
 *   which is exactly the point: kids and hobbyists can sign up with just a
 *   name and a password.
 *
 *   ⚠️ For this to work you MUST turn OFF email confirmation in Supabase:
 *   Dashboard → Authentication → Sign In / Up → Email → disable
 *   "Confirm email". (Step-by-step in the README.)
 *
 *   The optional recovery email lives on the `profiles` table and is only
 *   informational for now (see README "Password recovery").
 */
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";
import type { Profile } from "./types";

/** Usernames: 3–20 chars, lowercase letters / numbers / underscore. */
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/** The fake-email domain. Changing it would break existing logins — don't. */
const FAKE_EMAIL_DOMAIN = "computronium.local";

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Who is making this request? Returns their profile row, or null if not
 * signed in. Used by API routes and server components.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/**
 * Is this profile the site admin? Two ways to be admin:
 *   1. Your username matches the ADMIN_USERNAME env var, or
 *   2. Your row in `profiles` has is_admin = true.
 */
export function isAdmin(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;
  const adminName = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  return Boolean(adminName && profile.username.toLowerCase() === adminName);
}
