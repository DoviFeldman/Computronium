/**
 * VERSION HISTORY (/p/<id>/history) — GitHub-style, full snapshots.
 *
 * Every save of a post wrote a complete copy into `post_versions` (never a
 * diff, never deleted). This page lists them newest-first; expand any
 * version to see exactly what the post said back then — name, description,
 * instructions, code, parts, files.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { hardwareById } from "@/config/hardware";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostFull } from "@/lib/types";

export const dynamic = "force-dynamic";

type VersionRow = {
  id: string;
  version_number: number;
  snapshot: PostFull;
  created_at: string;
};

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: post } = await admin.from("posts").select("id, name").eq("id", id).maybeSingle();
  if (!post) notFound();

  const { data } = await admin
    .from("post_versions")
    .select("id, version_number, snapshot, created_at")
    .eq("post_id", id)
    .order("version_number", { ascending: false });
  const versions = (data ?? []) as VersionRow[];

  return (
    <div>
      <p className="small">
        <Link href={`/p/${id}`}>← Back to {post.name}</Link>
      </p>
      <h1>🕘 History of “{post.name}”</h1>
      <p className="tagline">
        Every edit saved a full snapshot — nothing is ever lost. Newest first.
      </p>

      {versions.map((v) => {
        const s = v.snapshot;
        return (
          <details key={v.id} className="version-item" open={v === versions[0]}>
            <summary>
              Version {v.version_number} — {new Date(v.created_at).toLocaleString()}
            </summary>
            <div className="body">
              <p><strong>Name:</strong> {s.name}</p>
              {s.description && <p><strong>Description:</strong> {s.description}</p>}
              {s.instructions && (
                <>
                  <p><strong>Instructions:</strong></p>
                  <p className="prose small">{s.instructions}</p>
                </>
              )}
              {(s.post_hardware?.length ?? 0) > 0 && (
                <p>
                  <strong>Parts:</strong>{" "}
                  {s.post_hardware
                    .map((h) =>
                      h.hardware_id
                        ? hardwareById[h.hardware_id]?.name ?? h.hardware_id
                        : h.custom_name
                    )
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {(s.post_files?.length ?? 0) > 0 && (
                <p>
                  <strong>Files:</strong>{" "}
                  {s.post_files.map((f) => f.filename ?? f.url).join(", ")}
                </p>
              )}
              {s.code_text && <pre className="code-block">{s.code_text}</pre>}
            </div>
          </details>
        );
      })}

      {versions.length === 0 && <p className="muted">No versions recorded yet.</p>}
    </div>
  );
}
