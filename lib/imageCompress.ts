/**
 * Client-side image compression — runs in the BROWSER before upload.
 *
 * Phones produce 5–12MB photos; we shrink them to ≤1200px WebP (~100–300KB)
 * before they ever leave the poster's device. That keeps uploads fast,
 * stays under the 4MB upload limit, and stretches the free Supabase
 * storage a very long way.
 *
 * Used by: the images section of app/post/page.tsx.
 */

const MAX_DIMENSION = 1200; // longest side, in pixels
const QUALITY = 0.82; // 0..1 — visually near-lossless for photos

export async function compressImage(file: File): Promise<{ blob: Blob; filename: string }> {
  // Decode the image. createImageBitmap is fast and supported everywhere modern.
  const bitmap = await createImageBitmap(file);

  // Work out the new size, only ever scaling DOWN.
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Prefer WebP (smaller); fall back to JPEG on old browsers.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );
  if (blob && blob.type === "image/webp") {
    return { blob, filename: replaceExt(file.name, "webp") };
  }

  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!jpeg) throw new Error("Could not compress image in this browser.");
  return { blob: jpeg, filename: replaceExt(file.name, "jpg") };
}

function replaceExt(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, "") + "." + ext;
}
