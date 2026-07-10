"use client";

/**
 * A small reusable "add pictures" field — pick images, they're compressed
 * in the browser (lib/imageCompress.ts) and uploaded via /api/upload, then
 * shown as thumbnails with a remove button.
 *
 * Used by the Questions page (the ask form and every reply form). The post
 * form has its own richer version; this one stays deliberately tiny.
 */
import { useState } from "react";
import { compressImage } from "@/lib/imageCompress";
import type { QuestionImage } from "@/lib/types";

export default function ImageUploadField({
  images,
  onChange,
  onError,
}: {
  images: QuestionImage[];
  onChange: (images: QuestionImage[]) => void;
  onError: (message: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const onPick = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploading(true);
    onError(null);
    let current = images;
    for (const file of Array.from(fileList)) {
      try {
        const { blob, filename } = await compressImage(file);
        const form = new FormData();
        form.append("file", new File([blob], filename, { type: blob.type }));
        form.append("kind", "image");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) {
          onError(json.error ?? "Upload failed.");
          continue;
        }
        current = [...current, { url: json.url, path: json.path, filename: json.filename }];
        onChange(current);
      } catch {
        onError(`Couldn't process image ${file.name}.`);
      }
    }
    setUploading(false);
  };

  return (
    <div className="field">
      <label>📷 Pictures (optional)</label>
      <input type="file" multiple accept="image/*" onChange={(e) => onPick(e.target.files)} />
      {uploading && <p className="muted small">Uploading…</p>}
      {images.length > 0 && (
        <div className="chips">
          {images.map((img, i) => (
            <span key={img.url} style={{ position: "relative" }}>
              <img src={img.url} alt={img.filename ?? "picture"} style={{ height: 72, borderRadius: 8 }} />
              <button
                className="chip chip-muted"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
