/**
 * MAIN PAGE — the MakerWorld-style project feed.
 *
 * Endless scroll, 2 cards per row (1 on mobile), hot-ranked (tune the
 * ranking in config/site.ts), searchable and filterable. The featured
 * board row comes from config/featuredBoards.ts.
 *
 * By design there is NO upload button here — posting starts from the
 * personal page (/u/yourname).
 */
import { site } from "@/config/site";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div>
      <h1>{site.name}</h1>
      <p className="tagline">{site.tagline}</p>
      <Feed scope="main" />
    </div>
  );
}
