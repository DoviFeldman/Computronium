/**
 * POST /api/posts/[id]/vote — upvote a post (feeds the hot ranking).
 *
 * Deliberately simple: no accounts required, no server-side dedup. The
 * button disables itself per-browser via localStorage. Someone determined
 * could clear storage and vote twice — acceptable for now; if it becomes a
 * problem, add a `post_votes` table keyed by user/IP.
 */
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data } = await admin.from("posts").select("upvotes").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await admin.from("posts").update({ upvotes: data.upvotes + 1 }).eq("id", id);
  return NextResponse.json({ ok: true, upvotes: data.upvotes + 1 });
}
