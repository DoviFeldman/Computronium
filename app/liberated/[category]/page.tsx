/**
 * One Alternatives category (/liberated/smart-home etc.).
 *
 * Shows the admin's ranked "top picks" (alternatives_rank 1–3) prominently,
 * then everything else assigned to the category. Assignment and ranking
 * happen on /admin; the category list itself lives in config/categories.ts.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoriesById } from "@/config/categories";
import PostCard from "@/components/PostCard";
import { POST_SELECT, toFeedPost } from "@/lib/posts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostFull } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = categoriesById[category];
  if (!cat) notFound();

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("posts")
    .select(POST_SELECT)
    .eq("alternatives_category", category)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as unknown as PostFull[]);
  const topPicks = rows
    .filter((p) => p.alternatives_rank != null)
    .sort((a, b) => (a.alternatives_rank ?? 9) - (b.alternatives_rank ?? 9))
    .slice(0, 3);
  const rest = rows.filter((p) => !topPicks.includes(p));

  return (
    <div>
      <p className="small">
        <Link href="/liberated">← All categories</Link>
      </p>
      <h1>
        {cat.emoji} {cat.name}
      </h1>
      <p className="tagline">{cat.blurb}</p>

      {rows.length === 0 && (
        <p className="muted center" style={{ padding: "48px 0" }}>
          Nothing curated here yet — the site owner picks these by hand.
        </p>
      )}

      {topPicks.length > 0 && (
        <>
          <h2>🏆 Top picks</h2>
          <div className="feed-grid">
            {topPicks.map((p) => (
              <PostCard key={p.id} post={toFeedPost(p)} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2>More in this category</h2>
          <div className="feed-grid">
            {rest.map((p) => (
              <PostCard key={p.id} post={toFeedPost(p)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
