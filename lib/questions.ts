/**
 * Shared server-side helpers for the Questions page (/questions).
 *
 * Questions are deliberately much simpler than posts: a row is just text +
 * a jsonb array of picture objects. These helpers validate what the browser
 * sends and clean up uploaded pictures when something is deleted.
 */
import { deleteFile } from "./storage";
import type { QuestionImage } from "./types";

/** Hard cap on pictures per question/reply — plenty, and keeps abuse cheap. */
const MAX_IMAGES = 8;

/**
 * Validate the images array the browser sent. Anything that isn't
 * { url: string, ... } is dropped; extra fields are stripped.
 */
export function sanitizeImages(raw: unknown): QuestionImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .filter((i) => typeof i.url === "string" && i.url.trim() !== "")
    .slice(0, MAX_IMAGES)
    .map((i) => ({
      url: String(i.url),
      path: typeof i.path === "string" ? i.path : null,
      filename: typeof i.filename === "string" ? i.filename : null,
    }));
}

/** Delete every uploaded picture in a list from storage (external-less, best effort). */
export async function deleteImageFiles(images: QuestionImage[] | null | undefined) {
  for (const img of images ?? []) {
    if (img.path) await deleteFile(img.path);
  }
}
