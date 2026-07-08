/**
 * POST /api/posts/[id]/view — count a page view (feeds the hot ranking).
 * The post page fires this once per browser session (sessionStorage guard).
 * Read-then-write isn't perfectly atomic, but for a view counter on a hobby
 * site an occasional lost increment is completely fine.
 */
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data } = await admin.from("posts").select("views").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await admin.from("posts").update({ views: data.views + 1 }).eq("id", id);
  return NextResponse.json({ ok: true });
}
