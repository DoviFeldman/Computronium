/**
 * POST PAGE (/post) — the one-page create/edit form.
 *
 * This thin server wrapper figures out two things and hands them to the big
 * client form (components/PostForm.tsx):
 *   - ?edit=<id>  → edit mode (saves create a new version, GitHub-style)
 *   - who's signed in (decides owned vs anonymous posting flow)
 */
import PostForm from "@/components/PostForm";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const profile = await getCurrentProfile();

  return <PostForm editId={edit ?? null} viewerUsername={profile?.username ?? null} />;
}
