/**
 * POST /api/upload — receive a file from the browser and store it via the
 * storage adapter (lib/storage.ts). Returns { url, path, filename }.
 *
 * The post form sends files here one at a time as multipart form-data:
 *   file — the file itself (images arrive already compressed client-side)
 *   kind — "image" | "model" | "code"  (decides the allowed extensions)
 *
 * Size is capped at 4MB (Vercel free-tier body limit; big STLs and zips
 * should be linked externally — the form supports that).
 */
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, uploadFile } from "@/lib/storage";
import { randomBytes } from "crypto";

/** Extensions we accept per kind — a light sanity check, not deep security. */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  model: ["stl", "3mf", "obj", "step", "stp", "f3d", "scad", "gcode"],
  code: ["ino", "c", "cpp", "h", "hpp", "py", "js", "ts", "json", "txt", "md", "yaml", "yml", "zip"],
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "");

  if (!(file instanceof File) || !ALLOWED_EXTENSIONS[kind]) {
    return NextResponse.json({ error: "Bad upload request." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is over 4MB. Please link big files externally (GitHub etc.) instead." },
      { status: 413 }
    );
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS[kind].includes(ext)) {
    return NextResponse.json(
      { error: `".${ext}" files aren't accepted as ${kind} uploads.` },
      { status: 400 }
    );
  }

  // Safe unique path: strip weird characters, prefix with random id.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${kind}s/${randomBytes(8).toString("hex")}-${safeName}`;

  try {
    const result = await uploadFile(
      await file.arrayBuffer(),
      path,
      file.type || "application/octet-stream"
    );
    return NextResponse.json({ ...result, filename: file.name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
