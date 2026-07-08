/**
 * POST /api/auth/login — sign in with username + password.
 * The username is converted to its fake email (see lib/auth.ts) because
 * that's what Supabase Auth stores under the hood.
 */
import { NextResponse } from "next/server";
import { normalizeUsername, usernameToEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = normalizeUsername(String(body?.username ?? ""));
  const password = String(body?.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, username });
}
