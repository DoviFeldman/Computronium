/**
 * POST /api/questions/[id]/replies — add a reply to a question.
 *
 * Body: { body, images }. A reply needs SOME content — text or at least one
 * picture. Signed in → the reply carries your username; signed out → shown
 * as anonymous.
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { sanitizeImages } from "@/lib/questions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const text = String(body?.body ?? "").trim();
  const images = sanitizeImages(body?.images);
  if (!text && images.length === 0) {
    return NextResponse.json(
      { error: "Write something (or add a picture) first." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Make sure the question still exists (404 beats a dangling foreign key error).
  const { data: question } = await admin
    .from("questions")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!question) {
    return NextResponse.json({ error: "That question is gone." }, { status: 404 });
  }

  const profile = await getCurrentProfile();
  const { data: created, error } = await admin
    .from("question_replies")
    .insert({
      question_id: id,
      owner_id: profile?.id ?? null,
      body: text || null,
      images,
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? "Could not post the reply." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: created.id });
}
