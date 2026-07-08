/**
 * PERSONAL PAGE (/u/username) — like a personal GitHub page.
 *
 * Shows the user's profile (username + optional bio) and all their posts.
 * This is the ONLY place with a "New Post" button (product decision from
 * the spec: uploading starts from your own page, not the feed).
 * The page owner also gets Edit buttons on their posts and a Settings link.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { getCurrentProfile } from "@/lib/auth";
import { POST_SELECT, toFeedPost } from "@/lib/posts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostFull, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const admin = createSupabaseAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  const profile = profileData as Profile | null;
  if (!profile) notFound();

  const viewer = await getCurrentProfile();
  const isOwnPage = viewer?.id === profile.id;

  const { data: postsData } = await admin
    .from("posts")
    .select(POST_SELECT)
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });
  const posts = ((postsData ?? []) as unknown as PostFull[]);

  return (
    <div>
      <div className="panel">
        <h1>@{profile.username}</h1>
        {profile.bio && <p>{profile.bio}</p>}
        <p className="muted small">
          {posts.length} project{posts.length === 1 ? "" : "s"} · joined{" "}
          {new Date(profile.created_at).toLocaleDateString()}
        </p>
        {isOwnPage && (
          <div className="chips" style={{ gap: 10 }}>
            {/* THE new-post button — the only one on the whole site. */}
            <Link href="/post" className="btn btn-primary">
              ＋ New Post
            </Link>
            <Link href="/settings" className="btn">
              ⚙️ Settings
            </Link>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="muted center" style={{ padding: "48px 0" }}>
          No projects yet.{isOwnPage && " Hit “New Post” to share your first build!"}
        </p>
      ) : (
        <div className="feed-grid">
          {posts.map((p) => (
            <div key={p.id}>
              <PostCard post={toFeedPost(p)} />
              {isOwnPage && (
                <p className="small" style={{ margin: "6px 4px" }}>
                  <Link href={`/post?edit=${p.id}`}>✏️ Edit</Link>
                  {" · "}
                  <Link href={`/p/${p.id}/history`}>🕘 History (v{p.current_version})</Link>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
