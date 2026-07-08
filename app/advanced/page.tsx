/**
 * ADVANCED PROJECTS PAGE — the showcase of cool, hard builds.
 *
 * Same grid and filters as the main page, but only posts flagged advanced:
 * a post lands here when its difficulty is 🔴 (that automatically sets the
 * `advanced` flag — see lib/posts.ts) or when the poster ticks the
 * "advanced" box on the form. Read-only browsing, same card design.
 */
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default function AdvancedPage() {
  return (
    <div>
      <h1>🔴 Advanced Projects</h1>
      <p className="tagline">
        The deep end: complex builds by experienced makers. Look, learn, and
        when you're ready — fork one.
      </p>
      <Feed scope="advanced" />
    </div>
  );
}
