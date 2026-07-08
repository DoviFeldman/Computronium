/**
 * ADMIN PAGE (/admin) — the owner's control panel.
 *
 * Who gets in: the ADMIN_USERNAME env var, or any profile with
 * is_admin = true (see lib/auth.ts). Everyone else sees a polite no.
 *
 * What it does (via /api/admin/posts/[id]):
 *   - delete any post
 *   - assign posts to Alternatives categories (config/categories.ts)
 *     with an optional 1–3 "top pick" rank
 *   - pin/unpin posts (pinned posts float up the main feed —
 *     the boost amount is in config/site.ts)
 */
import { redirect } from "next/navigation";
import AdminTable from "@/components/AdminTable";
import { getCurrentProfile, isAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) redirect("/");

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("posts")
    .select("id, name, created_at, difficulty, advanced, pinned, alternatives_category, alternatives_rank, upvotes, views, owner:profiles(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  // The joined `owner` arrives as an object; normalize for the client table.
  const posts = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    created_at: p.created_at as string,
    difficulty: (p.difficulty as string) ?? null,
    advanced: Boolean(p.advanced),
    pinned: Boolean(p.pinned),
    alternatives_category: (p.alternatives_category as string) ?? null,
    alternatives_rank: (p.alternatives_rank as number) ?? null,
    upvotes: p.upvotes as number,
    views: p.views as number,
    ownerUsername:
      (p.owner as unknown as { username: string } | null)?.username ?? null,
  }));

  return (
    <div>
      <h1>🛡 Admin</h1>
      <p className="tagline">The 100 most recent posts. Handle with care.</p>
      <AdminTable posts={posts} />
    </div>
  );
}
