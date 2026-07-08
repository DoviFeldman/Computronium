/**
 * PUBLIC POST PAGE (/p/<id>) — where a project is actually viewed.
 *
 * Renders everything a post can have, all optional: images, video embed,
 * description, prompted-question answers, build instructions, 3D files
 * (uploaded STLs render in the in-browser viewer; external links too when
 * they point at a raw .stl), code, the hardware list with buy links, fork
 * lineage, difficulty, and price.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { hardwareById } from "@/config/hardware";
import { promptedQuestions } from "@/config/promptedQuestions";
import DifficultyDot from "@/components/DifficultyDot";
import PostActions from "@/components/PostActions";
import StlViewer from "@/components/StlViewer";
import VideoEmbed from "@/components/VideoEmbed";
import { getCurrentProfile } from "@/lib/auth";
import { fetchPostFull, sanitizePost } from "@/lib/posts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { looksLikeStl, toDirectFileUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await fetchPostFull(id);
  if (!raw) notFound();
  const post = sanitizePost(raw);

  const viewer = await getCurrentProfile();

  // "Forked from …" lineage link.
  let forkedFrom: { id: string; name: string } | null = null;
  if (post.fork_of) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("posts")
      .select("id, name")
      .eq("id", post.fork_of)
      .maybeSingle();
    forkedFrom = data ?? null;
  }

  const images = post.post_files.filter((f) => f.kind === "image");
  const models = post.post_files.filter((f) => f.kind === "model");
  const codeFiles = post.post_files.filter((f) => f.kind === "code");
  const answers = post.answers ?? {};

  return (
    <div>
      <h1>{post.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        <DifficultyDot difficulty={post.difficulty} withLabel />{" "}
        {post.price_estimate != null && <>· ~${Number(post.price_estimate)} in parts </>}
        {post.owner ? (
          <>· by <Link href={`/u/${post.owner.username}`}>@{post.owner.username}</Link></>
        ) : (
          <>· by an anonymous maker</>
        )}
        {forkedFrom && (
          <> · ⑂ forked from <Link href={`/p/${forkedFrom.id}`}>{forkedFrom.name}</Link></>
        )}
      </p>

      <PostActions
        postId={post.id}
        upvotes={post.upvotes}
        views={post.views}
        forkCount={post.fork_count}
        isSignedIn={Boolean(viewer)}
      />
      <div className="spacer" />

      {/* --- images ------------------------------------------------------ */}
      {images.map((img) => (
        <p key={img.id}>
          <img className="post-hero-img" src={img.url} alt={img.filename ?? post.name} />
        </p>
      ))}

      {/* --- video -------------------------------------------------------- */}
      {post.video_url && (
        <div className="panel">
          <VideoEmbed url={post.video_url} />
        </div>
      )}

      {/* --- description & prompted answers -------------------------------- */}
      {post.description && (
        <div className="panel">
          <p className="prose" style={{ margin: 0 }}>{post.description}</p>
        </div>
      )}

      {promptedQuestions.some((q) => answers[q.id]) && (
        <div className="panel">
          {promptedQuestions.map(
            (q) =>
              answers[q.id] && (
                <div key={q.id} className="qa-item">
                  <div className="q">{q.question}</div>
                  <p className="prose" style={{ margin: "4px 0 0" }}>{answers[q.id]}</p>
                </div>
              )
          )}
        </div>
      )}

      {/* --- instructions --------------------------------------------------- */}
      {post.instructions && (
        <div className="panel">
          <h2>🔧 Build instructions</h2>
          <p className="prose" style={{ margin: 0 }}>{post.instructions}</p>
        </div>
      )}

      {/* --- 3D files -------------------------------------------------------- */}
      {models.length > 0 && (
        <div className="panel">
          <h2>🧊 3D files</h2>
          {models.map((m) => {
            const directUrl = toDirectFileUrl(m.url);
            const canRender = looksLikeStl(m.filename ?? directUrl);
            return (
              <div key={m.id} style={{ marginBottom: 16 }}>
                <p className="small" style={{ margin: "0 0 6px" }}>
                  <strong>{m.filename ?? m.url.split("/").pop()}</strong>{" "}
                  <a href={directUrl} target="_blank" rel="noopener noreferrer">
                    {m.is_external ? "open link ↗" : "download ↓"}
                  </a>
                </p>
                {/* Only raw STL links can render in-browser; 3MF/repo links stay links. */}
                {canRender && <StlViewer url={directUrl} name={m.filename ?? undefined} />}
              </div>
            );
          })}
        </div>
      )}

      {/* --- code ------------------------------------------------------------ */}
      {(post.code_text || codeFiles.length > 0) && (
        <div className="panel">
          <h2>💻 Code</h2>
          {codeFiles.map((f) => (
            <p key={f.id} className="small" style={{ margin: "0 0 6px" }}>
              📄 <a href={f.url} target="_blank" rel="noopener noreferrer">{f.filename ?? f.url}</a>
            </p>
          ))}
          {post.code_text && <pre className="code-block">{post.code_text}</pre>}
        </div>
      )}

      {/* --- hardware list ----------------------------------------------------- */}
      {post.post_hardware.length > 0 && (
        <div className="panel">
          <h2>🔩 Parts list</h2>
          <table className="hw-table">
            <tbody>
              {post.post_hardware.map((h) => {
                const item = h.hardware_id ? hardwareById[h.hardware_id] : null;
                const name = item?.name ?? h.custom_name ?? h.hardware_id;
                const link = item?.buyLink ?? h.custom_link;
                const price = h.custom_price ?? item?.price;
                return (
                  <tr key={h.id}>
                    <td>{name}</td>
                    <td className="muted small">{item?.note}</td>
                    <td>{price != null && `~$${Number(price)}`}</td>
                    <td>
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          buy ↗
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted small">
        Posted {new Date(post.created_at).toLocaleDateString()} · version{" "}
        {post.current_version} · <Link href={`/p/${post.id}/history`}>see edit history</Link>
      </p>
    </div>
  );
}
