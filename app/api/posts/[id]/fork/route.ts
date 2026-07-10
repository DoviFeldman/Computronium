/**
 * POST /api/posts/[id]/fork — copy a post to YOUR account (like a GitHub fork).
 *
 * Copies the entire latest version — fields, hardware list, files/links —
 * into a brand-new post owned by the forking user, with `fork_of` pointing
 * back at the original. The fork then evolves independently with its own
 * version history; the original is never touched (except fork_count + 1).
 *
 * Requires being signed in (a fork has to live on someone's personal page).
 * File rows are copied by URL — the actual bytes in storage are shared, not
 * duplicated, which keeps the free storage tier happy.
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { fetchPostFull, saveVersionSnapshot } from "@/lib/posts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json(
      { error: "Sign in to fork — the fork needs a personal page to live on." },
      { status: 401 }
    );
  }

  const original = await fetchPostFull(id);
  if (!original) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const admin = createSupabaseAdminClient();

  // 1. New post row: copy the content fields, reset the social counters.
  const { data: fork, error } = await admin
    .from("posts")
    .insert({
      owner_id: profile.id,
      name: original.name,
      description: original.description,
      answers: original.answers,
      instructions: original.instructions,
      code_text: original.code_text,
      video_url: original.video_url,
      difficulty: original.difficulty,
      advanced: original.advanced,
      attempted: original.attempted,
      price_estimate: original.price_estimate,
      fork_of: original.id,
    })
    .select("id")
    .single();
  if (error || !fork) {
    return NextResponse.json({ error: error?.message ?? "Fork failed." }, { status: 500 });
  }

  // 2. Copy hardware rows.
  const hardwareRows = (original.post_hardware ?? []).map((h) => ({
    post_id: fork.id,
    hardware_id: h.hardware_id,
    custom_name: h.custom_name,
    custom_link: h.custom_link,
    custom_price: h.custom_price,
  }));
  if (hardwareRows.length) await admin.from("post_hardware").insert(hardwareRows);

  // 3. Copy file rows (shared URLs — see header comment).
  const fileRows = (original.post_files ?? []).map((f) => ({
    post_id: fork.id,
    kind: f.kind,
    url: f.url,
    storage_path: null, // the ORIGINAL owns the storage object; forks just link it
    filename: f.filename,
    is_external: f.is_external,
  }));
  if (fileRows.length) await admin.from("post_files").insert(fileRows);

  // 4. The fork starts its own history at version 1.
  await saveVersionSnapshot(fork.id, 1);

  // 5. Bump the original's fork counter.
  await admin
    .from("posts")
    .update({ fork_count: original.fork_count + 1 })
    .eq("id", original.id);

  return NextResponse.json({ id: fork.id, ownerUsername: profile.username });
}
