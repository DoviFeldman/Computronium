/**
 * ============================================================================
 * ALTERNATIVES CATEGORIES — sections of the /liberated page
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   The categories on the Alternatives page (display title set in
 *   config/site.ts → `liberated.title`). Each category becomes a tile on
 *   /liberated and its own page at /liberated/<id>.
 *
 *   Posts appear inside a category ONLY when the admin assigns them from
 *   the /admin page (owner-curated, on purpose). The admin can also rank a
 *   post 1–3 to make it a highlighted "Top pick".
 *
 * WHO READS IT
 *   - app/liberated/page.tsx (the category tiles)
 *   - app/liberated/[category]/page.tsx (each category's list)
 *   - app/admin/page.tsx (the assign-to-category dropdown)
 *
 * HOW TO EDIT
 *   Add/remove/reword entries freely. If you DELETE a category that already
 *   has posts assigned, those posts just stop appearing on /liberated until
 *   you reassign them (nothing breaks). Keep `id` stable once posts are
 *   assigned to it — assignments are stored by id.
 * ============================================================================
 */

export type AlternativesCategory = {
  /** Permanent id, also used in the URL: /liberated/<id> */
  id: string;
  /** Display name of the category. */
  name: string;
  /** Emoji shown on the tile — pick anything you like. */
  emoji: string;
  /** One-liner: what closed product does this liberate you from? */
  blurb: string;
};

export const alternativesCategories: AlternativesCategory[] = [
  {
    id: "smart-home",
    name: "Smart Home Systems",
    emoji: "🏠",
    blurb: "Lights, sensors and automations that don't need a company's cloud to work.",
  },
  {
    id: "ev-conversion",
    name: "Electric Car Conversions",
    emoji: "🚗",
    blurb: "Open controllers and battery systems for converting cars to electric.",
  },
  {
    id: "robot-vacuum",
    name: "Robot Vacuums",
    emoji: "🧹",
    blurb: "Vacuums you own and control — no app account, no map uploads.",
  },
  {
    id: "camera-systems",
    name: "Camera Systems & Camera Arms",
    emoji: "📷",
    blurb: "Security cams and motion rigs without monthly subscription fees.",
  },
];

/** Quick lookup by id. */
export const categoriesById = Object.fromEntries(
  alternativesCategories.map((c) => [c.id, c])
);
