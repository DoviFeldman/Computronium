/**
 * /api/admin/posts/[id] — admin-only post controls (used by /admin).
 *
 * PATCH — assign to an Alternatives category (+ optional 1–3 top-pick rank)
 *         and/or pin/unpin in the main feed. Send only the fields to change:
 *           { alternativesCategory: "smart-home" | null,
 *             alternativesRank: 1 | 2 | 3 | null,
 *             pinned: true | false }
 * DELETE — remove any post (and its uploaded files).
 *
 * Admin = ADMIN_USERNAME env var, or is_admin=true on the profile row.
 */
import { NextResponse } from "next/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { fetchPostFull } from "@/lib/posts";
import { deleteFile } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Only touch the fields the request actually included.
  const updates: Record<string, unknown> = {};
  if ("alternativesCategory" in body) updates.alternatives_category = body.alternativesCategory;
  if ("alternativesRank" in body) updates.alternatives_rank = body.alternativesRank;
  if ("pinned" in body) updates.pinned = Boolean(body.pinned);
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("posts").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { id } = await params;
  const post = await fetchPostFull(id);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  for (const file of post.post_files ?? []) {
    if (file.storage_path) await deleteFile(file.storage_path);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
