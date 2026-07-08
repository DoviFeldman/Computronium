/**
 * ============================================================================
 * STORAGE ADAPTER — the ONE file to edit when switching storage providers
 * ============================================================================
 *
 * All file storage in Computronium (images, STL models, code files) flows
 * through the three functions in this file:
 *
 *     uploadFile(...)   — store a file, get back its path + public URL
 *     getFileUrl(...)   — turn a stored path into a public URL
 *     deleteFile(...)   — remove a stored file
 *
 * TODAY it's backed by Supabase Storage (free tier, ~1GB). LATER, when the
 * site grows, you can switch to Cloudflare R2 (10GB free, no egress fees)
 * by rewriting ONLY the function bodies below — nothing else in the app
 * imports Supabase Storage directly, so no other file needs to change.
 *
 * HOW TO SWAP IN CLOUDFLARE R2 LATER
 *   1. npm install @aws-sdk/client-s3   (R2 speaks the S3 protocol)
 *   2. Add env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *      R2_BUCKET, R2_PUBLIC_URL (your r2.dev or custom-domain URL)
 *   3. Replace the bodies of uploadFile / getFileUrl / deleteFile with
 *      S3 PutObjectCommand / URL join / DeleteObjectCommand calls.
 *   4. Old files keep their old Supabase URLs (stored per-file in the DB),
 *      so nothing breaks — new uploads simply go to R2.
 *
 * ⚠️ SERVER-ONLY: this module uses the service-role key. Browsers upload
 * via POST /api/upload (see app/api/upload/route.ts), which calls this.
 * ============================================================================
 */

import { createSupabaseAdminClient } from "./supabase/admin";

/**
 * Name of the Supabase Storage bucket. It's created automatically by
 * supabase/schema.sql (as a PUBLIC bucket, so files get plain URLs).
 * If you rename it, rename it there too.
 */
export const STORAGE_BUCKET = "computronium-files";

/**
 * Max upload size in bytes. Two reasons for 4MB:
 *  - Vercel free-tier serverless functions reject request bodies > ~4.5MB.
 *  - Keeps the free 1GB Supabase bucket from filling up fast.
 * Bigger files (large STLs, zips) should be linked externally (GitHub etc.)
 * — the post form supports external links for exactly this reason.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type UploadResult = {
  /** Provider-internal path — stored in the DB so deleteFile can find it. */
  path: string;
  /** Public URL anyone can load — also stored in the DB and used in <img> etc. */
  url: string;
};

/**
 * Store a file and return its path + public URL.
 *
 * @param data        raw file bytes
 * @param path        where to store it, e.g. "posts/abc123/photo-1.webp"
 *                    (the upload API route generates safe unique paths)
 * @param contentType MIME type, e.g. "image/webp" or "model/stl"
 */
export async function uploadFile(
  data: ArrayBuffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, data, { contentType, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { path, url: getFileUrl(path) };
}

/**
 * Turn a stored path into a public URL.
 * (For Supabase public buckets this is just a predictable URL join —
 * no network call needed.)
 */
export function getFileUrl(path: string): string {
  const supabase = createSupabaseAdminClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a stored file. Called when the admin deletes a post.
 * Failing quietly is fine here — a leftover orphan file is harmless.
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}
