/**
 * Shared server-side post helpers used by the API routes and pages.
 *
 * Central place for: fetching posts with their related rows, stripping the
 * secret anon-edit-password before anything reaches a browser, saving the
 * hardware/file rows, and building the full-copy version snapshots that
 * power GitHub-style edit history.
 */
import { createSupabaseAdminClient } from "./supabase/admin";
import type { FeedPost, PostFull, PostInput, PostRow } from "./types";

/**
 * The select string that pulls a post plus all its related rows in one query.
 * `owner:profiles(username)` follows the posts.owner_id → profiles.id link.
 */
export const POST_SELECT =
  "*, post_hardware(*), post_files(*), owner:profiles(username)";

/** Remove server-only secrets before a post row leaves the server. */
export function sanitizePost<T extends { anon_edit_password?: unknown }>(
  row: T
): Omit<T, "anon_edit_password"> {
  const { anon_edit_password: _secret, ...safe } = row;
  return safe;
}

/** Fetch one post with everything joined, or null. */
export async function fetchPostFull(id: string): Promise<(PostFull & { anon_edit_password: string | null }) | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as (PostFull & { anon_edit_password: string | null })) ?? null;
}

/**
 * Replace a post's hardware + file rows with what the form sent.
 * (Old rows are deleted and re-inserted — dead simple, and the version
 * history keeps every prior state anyway.)
 */
export async function saveRelations(postId: string, input: PostInput) {
  const admin = createSupabaseAdminClient();

  await admin.from("post_hardware").delete().eq("post_id", postId);
  await admin.from("post_files").delete().eq("post_id", postId);

  const hardwareRows = [
    ...input.hardwareIds.map((hid) => ({
      post_id: postId,
      hardware_id: hid,
      custom_name: null,
      custom_link: null,
      custom_price: null,
    })),
    ...input.customHardware
      .filter((c) => c.name.trim())
      .map((c) => ({
        post_id: postId,
        hardware_id: null,
        custom_name: c.name.trim(),
        custom_link: c.link.trim() || null,
        custom_price: c.price,
      })),
  ];
  if (hardwareRows.length) {
    await admin.from("post_hardware").insert(hardwareRows);
  }

  const fileRows = input.files
    .filter((f) => f.url.trim())
    .map((f) => ({
      post_id: postId,
      kind: f.kind,
      url: f.url,
      storage_path: f.storagePath,
      filename: f.filename,
      is_external: f.isExternal,
    }));
  if (fileRows.length) {
    await admin.from("post_files").insert(fileRows);
  }
}

/**
 * GitHub-style versioning: save a FULL snapshot of the post (fields +
 * hardware + files) as version N. Never diffs, never deletes old versions.
 * The History tab renders these snapshots.
 */
export async function saveVersionSnapshot(postId: string, versionNumber: number) {
  const admin = createSupabaseAdminClient();
  const post = await fetchPostFull(postId);
  if (!post) return;

  const snapshot = {
    ...sanitizePost(post), // full copy, minus the secret password hash
  };

  await admin.from("post_versions").insert({
    post_id: postId,
    version_number: versionNumber,
    snapshot,
  });
}

/** Shrink a joined post row down to what a feed card needs. */
export function toFeedPost(row: PostFull): FeedPost {
  const firstImage = row.post_files?.find((f) => f.kind === "image") ?? null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    difficulty: row.difficulty,
    advanced: row.advanced,
    price_estimate: row.price_estimate,
    video_url: row.video_url,
    hardwareIds: (row.post_hardware ?? [])
      .filter((h) => h.hardware_id)
      .map((h) => h.hardware_id as string),
    customNames: (row.post_hardware ?? [])
      .filter((h) => h.custom_name)
      .map((h) => h.custom_name as string),
    imageUrl: firstImage?.url ?? null,
    upvotes: row.upvotes,
    views: row.views,
    created_at: row.created_at,
    pinned: row.pinned,
    fork_count: row.fork_count,
    ownerUsername: row.owner?.username ?? null,
  };
}

/** Turn a PostInput (from the form) into the columns of a `posts` row. */
export function inputToPostColumns(input: PostInput): Partial<PostRow> {
  return {
    name: input.name.trim() || "Untitled project",
    description: input.description.trim() || null,
    answers: input.answers,
    instructions: input.instructions.trim() || null,
    code_text: input.codeText.trim() || null,
    video_url: input.videoUrl.trim() || null,
    difficulty: input.difficulty,
    // 🔴 difficulty automatically counts as advanced → shows on /advanced.
    advanced: input.advanced || input.difficulty === "red",
    price_estimate: input.priceEstimate,
  };
}
