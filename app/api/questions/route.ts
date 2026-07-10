/**
 * /api/questions
 *
 * GET  — the questions list, newest first, with the asker's username and a
 *        reply count per question. No paging — it returns the latest 200,
 *        which is years of runway for a hobby site.
 * POST — ask a question: { title, body, images }. Only the title is
 *        required. Signed in → the question carries your username;
 *        signed out → it's shown as anonymous (and can't be deleted by you).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { sanitizeImages } from "@/lib/questions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("questions")
    .select("*, owner:profiles(username), question_replies(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    title: string;
    body: string | null;
    images: unknown[];
    created_at: string;
    owner: { username: string } | null;
    question_replies: { count: number }[];
  };

  return NextResponse.json({
    questions: ((data ?? []) as unknown as Row[]).map((q) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      imageCount: Array.isArray(q.images) ? q.images.length : 0,
      created_at: q.created_at,
      ownerUsername: q.owner?.username ?? null,
      replyCount: q.question_replies?.[0]?.count ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Your question needs a title." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();

  const { data: created, error } = await admin
    .from("questions")
    .insert({
      owner_id: profile?.id ?? null,
      title: title.slice(0, 300),
      body: String(body?.body ?? "").trim() || null,
      images: sanitizeImages(body?.images),
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? "Could not post the question." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: created.id });
}
