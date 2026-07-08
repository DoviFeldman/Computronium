/**
 * One project card in the feed grid (main page, /advanced, personal pages,
 * and the liberated category pages all reuse this).
 *
 * Shows: hero image (or YouTube thumbnail, or a robot placeholder),
 * name, hardware chips, estimated price, difficulty dot, fork count.
 */
import Link from "next/link";
import { hardwareById } from "@/config/hardware";
import { parseVideoUrl } from "@/lib/video";
import type { FeedPost } from "@/lib/types";
import DifficultyDot from "./DifficultyDot";

/** How many hardware chips to show before "+N more". */
const MAX_CHIPS = 4;

export default function PostCard({ post }: { post: FeedPost }) {
  // Hero: first uploaded image → else YouTube thumbnail → else placeholder.
  const videoThumb = parseVideoUrl(post.video_url)?.thumbnailUrl ?? null;
  const hero = post.imageUrl ?? videoThumb;

  // Chip labels: config hardware names + custom part names.
  const chipNames = [
    ...post.hardwareIds.map((id) => hardwareById[id]?.name ?? id),
    ...post.customNames,
  ];

  return (
    <article className="card">
      <Link href={`/p/${post.id}`} className="card-link">
        <div className="card-hero">
          {hero ? <img src={hero} alt={post.name} loading="lazy" /> : <span>🤖</span>}
        </div>
        <div className="card-body">
          <h3 className="card-title">
            {post.pinned && "📌 "}
            {post.name}
          </h3>
          <div className="chips">
            {chipNames.slice(0, MAX_CHIPS).map((name) => (
              <span key={name} className="chip">{name}</span>
            ))}
            {chipNames.length > MAX_CHIPS && (
              <span className="chip chip-muted">+{chipNames.length - MAX_CHIPS} more</span>
            )}
          </div>
          <div className="card-meta">
            <DifficultyDot difficulty={post.difficulty} />
            {post.price_estimate != null && <span>~${Number(post.price_estimate)}</span>}
            {post.video_url && <span>🎬</span>}
            {post.fork_count > 0 && <span>⑂ {post.fork_count}</span>}
            {post.ownerUsername && <span>@{post.ownerUsername}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
