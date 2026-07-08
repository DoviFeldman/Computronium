/**
 * The "hot" ranking math for the main feed — Hacker-News style.
 *
 * All the tunable numbers live in config/site.ts (ranking section) so the
 * owner can adjust the feel of the feed without touching this logic.
 *
 *     points = upvotes * upvoteWeight + views * viewWeight  (+ pinnedBoost)
 *     score  = (points + 1) / (hoursOld + ageOffsetHours) ^ gravity
 *
 * New posts start with points ≈ 0 but a tiny age divisor, so they get a
 * fair shot at the top; popular posts hold on longer; everything sinks
 * eventually.
 */
import { site } from "@/config/site";

export function hotScore(post: {
  upvotes: number;
  views: number;
  pinned: boolean;
  created_at: string;
}): number {
  const { upvoteWeight, viewWeight, gravity, ageOffsetHours, pinnedBoost } =
    site.ranking;

  const hoursOld = Math.max(
    0,
    (Date.now() - new Date(post.created_at).getTime()) / 3_600_000
  );

  let points = post.upvotes * upvoteWeight + post.views * viewWeight;
  if (post.pinned) points += pinnedBoost;

  return (points + 1) / Math.pow(hoursOld + ageOffsetHours, gravity);
}
