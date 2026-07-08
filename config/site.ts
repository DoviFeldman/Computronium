/**
 * ============================================================================
 * SITE CONFIG — the master knobs for the whole site
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   - The site name and tagline shown in the header and browser tab.
 *   - The "hot" ranking formula used to sort the main feed (Hacker-News
 *     style: fresh posts get a boost, popular posts stay up longer).
 *   - The cost-bracket filter buttons on the main feed.
 *   - The display title of the Alternatives page (/liberated).
 *
 * WHO READS IT
 *   - app/page.tsx and app/api/posts/route.ts (feed + ranking + filters)
 *   - app/layout.tsx and components/Header.tsx (name/tagline)
 *   - app/liberated/* (page title)
 *   - lib/ranking.ts (the actual scoring math)
 *
 * HOW TO EDIT
 *   Just change the values. Save, redeploy (or refresh in dev), done.
 *   Nothing else in the codebase needs to change.
 * ============================================================================
 */

export const site = {
  /** Shown in the header and the browser tab. */
  name: "Computronium",

  /** Short line under the name on the main page. */
  tagline: "Open robot projects you can actually build.",

  /**
   * ---------------------------------------------------------------------
   * HOT RANKING — how the main feed decides what goes on top.
   *
   * Every post gets a score:
   *
   *      points = upvotes * upvoteWeight + views * viewWeight
   *      score  = (points + 1) / (hoursOld + ageOffsetHours) ^ gravity
   *
   * - Raise `upvoteWeight` to make upvotes matter more than views.
   * - Raise `gravity` to make old posts fall off FASTER (2.0 = brutal,
   *   1.0 = posts linger for days). Hacker News uses ~1.8.
   * - `ageOffsetHours` stops brand-new posts from dividing by ~zero and
   *   rocketing to the top with a single view.
   * - Pinned posts (admin feature) get `pinnedBoost` added to their points
   *   so they float near the top without being welded there forever.
   * ---------------------------------------------------------------------
   */
  ranking: {
    upvoteWeight: 4,
    viewWeight: 0.25,
    gravity: 1.6,
    ageOffsetHours: 2,
    pinnedBoost: 500,
  },

  /** How many cards the feed loads per "page" of infinite scroll. */
  feedPageSize: 12,

  /**
   * Cost-bracket filter buttons on the main feed. `min`/`max` are dollars;
   * `max: null` means "no upper limit". Add/remove brackets freely — the
   * buttons render straight from this array.
   */
  costBrackets: [
    { id: "under10", label: "< $10", min: 0, max: 10 },
    { id: "10to25", label: "$10–25", min: 10, max: 25 },
    { id: "25to50", label: "$25–50", min: 25, max: 50 },
    { id: "50plus", label: "$50+", min: 50, max: null },
  ] as { id: string; label: string; min: number; max: number | null }[],

  /**
   * The Alternatives page lives at /liberated. Rename its DISPLAY title
   * here anytime (the URL stays the same). Suggested names: "Liberated
   * Hardware", "Unsubscribe".
   */
  liberated: {
    title: "Liberated Hardware",
    tagline:
      "Open-source, self-hosted replacements for closed, subscription-locked products.",
  },
};
