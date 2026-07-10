/**
 * /api/questions/[id]
 *
 * GET    — one question with all its replies (oldest reply first, like a
 *          forum thread). Each item carries a `canDelete` flag computed for
 *          the CURRENT viewer (its owner, or the admin) so the client
 *          doesn't need to know who anyone is.
 * DELETE — remove the question, its replies (DB cascade), and every
 *          uploaded picture. Owner or admin only — anonymous questions can
 *          only be removed by the admin (there's no edit-password system
 *          here; questions are meant to be simple).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { deleteImageFiles } from "@/lib/questions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionImage, QuestionReplyRow, QuestionRow } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: questionData } = await admin
    .from("questions")
    .select("*, owner:profiles(username)")
    .eq("id", id)
    .maybeSingle();
  if (!questionData) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const question = questionData as QuestionRow & { owner: { username: string } | null };

  const { data: repliesData } = await admin
    .from("question_replies")
    .select("*, owner:profiles(username)")
    .eq("question_id", id)
    .order("created_at", { ascending: true });
  const replies = (repliesData ?? []) as (QuestionReplyRow & {
    owner: { username: string } | null;
  })[];

  const viewer = await getCurrentProfile();
  const admin_ = isAdmin(viewer);
  const canDelete = (ownerId: string | null) =>
    admin_ || Boolean(viewer && ownerId && ownerId === viewer.id);

  return NextResponse.json({
    question: {
      id: question.id,
      title: question.title,
      body: question.body,
      images: question.images ?? [],
      created_at: question.created_at,
      ownerUsername: question.owner?.username ?? null,
      canDelete: canDelete(question.owner_id),
    },
    replies: replies.map((r) => ({
      id: r.id,
      body: r.body,
      images: r.images ?? [],
      created_at: r.created_at,
      ownerUsername: r.owner?.username ?? null,
      canDelete: canDelete(r.owner_id),
    })),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: questionData } = await admin
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!questionData) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const question = questionData as QuestionRow;

  const viewer = await getCurrentProfile();
  const allowed =
    isAdmin(viewer) || Boolean(viewer && question.owner_id === viewer.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Only the asker (signed in) or the admin can delete this." },
      { status: 403 }
    );
  }

  // Clean up uploaded pictures — the question's own and every reply's.
  const { data: repliesData } = await admin
    .from("question_replies")
    .select("images")
    .eq("question_id", id);
  await deleteImageFiles(question.images);
  for (const r of (repliesData ?? []) as { images: QuestionImage[] }[]) {
    await deleteImageFiles(r.images);
  }

  const { error } = await admin.from("questions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
