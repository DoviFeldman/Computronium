/**
 * POST /api/auth/signup — create a username+password account.
 *
 * No email needed: we synthesize a fake address from the username (see
 * lib/auth.ts) and mark it pre-confirmed via the admin API, so no
 * confirmation mail is ever involved. The signup form shows the big
 * "no recovery email = lost password means lost account" warning.
 */
import { NextResponse } from "next/server";
import { normalizeUsername, usernameToEmail, USERNAME_REGEX } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = normalizeUsername(String(body?.username ?? ""));
  const password = String(body?.password ?? "");

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters: lowercase letters, numbers, underscore." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Username taken?
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  // Create the auth user with the synthesized email, pre-confirmed.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create account." },
      { status: 500 }
    );
  }

  // Create the matching profile row.
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
  });
  if (profileError) {
    // Roll back the half-made account so the username isn't stranded.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Could not create profile." }, { status: 500 });
  }

  // Log them in right away (sets the session cookie).
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username });
}
