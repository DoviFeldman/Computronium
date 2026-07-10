/**
 * DELETE /api/questions/[id]/replies/[replyId] — remove one reply (and its
 * uploaded pictures). Allowed for the reply's owner (signed in) or the
 * admin — anonymous replies can only be removed by the admin.
 */
import { NextResponse } from "next/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { deleteImageFiles } from "@/lib/questions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionReplyRow } from "@/lib/types";

type Params = { params: Promise<{ id: string; replyId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, replyId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: replyData } = await admin
    .from("question_replies")
    .select("*")
    .eq("id", replyId)
    .eq("question_id", id)
    .maybeSingle();
  if (!replyData) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const reply = replyData as QuestionReplyRow;

  const viewer = await getCurrentProfile();
  const allowed = isAdmin(viewer) || Boolean(viewer && reply.owner_id === viewer.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Only the replier (signed in) or the admin can delete this." },
      { status: 403 }
    );
  }

  await deleteImageFiles(reply.images);

  const { error } = await admin.from("question_replies").delete().eq("id", replyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
