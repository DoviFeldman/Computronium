/**
 * /api/posts/[id]
 *
 * GET    — one post with everything joined (secret password stripped).
 *          Used by the edit form to prefill fields.
 * PUT    — save an edit. Creates version N+1 (full snapshot — GitHub-style,
 *          old versions are never deleted). Allowed for: the owner, the
 *          admin, or anyone holding an anonymous post's edit password.
 * DELETE — delete the post (and its uploaded files). Same permission rules.
 */
import { NextResponse } from "next/server";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { verifyEditPassword } from "@/lib/password";
import {
  fetchPostFull,
  inputToPostColumns,
  sanitizePost,
  saveRelations,
  saveVersionSnapshot,
} from "@/lib/posts";
import { deleteFile } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/**
 * Who may edit/delete this post?
 *  - its owner (signed in)
 *  - the site admin
 *  - for anonymous posts: whoever supplies the edit password
 */
async function canModify(postId: string, password: string | undefined) {
  const post = await fetchPostFull(postId);
  if (!post) return { post: null, allowed: false };

  const profile = await getCurrentProfile();
  if (profile && post.owner_id === profile.id) return { post, allowed: true };
  if (isAdmin(profile)) return { post, allowed: true };
  if (!post.owner_id && verifyEditPassword(password ?? "", post.anon_edit_password)) {
    return { post, allowed: true };
  }
  return { post, allowed: false };
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const post = await fetchPostFull(id);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    post: sanitizePost(post),
    // Tells the edit form whether to ask for the anon edit password.
    isAnonymous: !post.owner_id,
  });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const input = body?.input as PostInput | undefined;
  const password = body?.password as string | undefined;
  if (!input) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const { post, allowed } = await canModify(id, password);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!allowed) {
    return NextResponse.json(
      { error: "You can't edit this post. Wrong password?" },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();
  const nextVersion = post.current_version + 1;

  const { error } = await admin
    .from("posts")
    .update({ ...inputToPostColumns(input), current_version: nextVersion })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await saveRelations(id, input);
  await saveVersionSnapshot(id, nextVersion); // full copy — never a diff

  return NextResponse.json({ ok: true, version: nextVersion });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const password = body?.password as string | undefined;

  const { post, allowed } = await canModify(id, password);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!allowed) {
    return NextResponse.json(
      { error: "You can't delete this post. Wrong password?" },
      { status: 403 }
    );
  }

  // Clean up uploaded files from storage (external links have no storage_path).
  for (const file of post.post_files ?? []) {
    if (file.storage_path) await deleteFile(file.storage_path);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
