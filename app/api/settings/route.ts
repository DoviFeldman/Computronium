/**
 * POST /api/settings — save the signed-in user's bio and optional
 * recovery email (see /settings page).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bio = String(body?.bio ?? "").slice(0, 500);
  const recoveryEmail = String(body?.recoveryEmail ?? "").trim().slice(0, 200);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ bio: bio || null, recovery_email: recoveryEmail || null })
    .eq("id", profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
