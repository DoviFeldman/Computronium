/**
 * The difficulty indicator: 🟢 plug & play / 🟡 some assembly / 🔴 advanced.
 * Used on cards, post pages, and the post form.
 *
 * ⚠️ SITE-WIDE DEPENDENCY: the 'red' value also routes posts to /advanced
 * (see lib/posts.ts → inputToPostColumns). If you change these levels,
 * update that logic and the database check constraint in supabase/schema.sql.
 */
import type { Difficulty } from "@/lib/types";

export const DIFFICULTY_META: Record<Difficulty, { dot: string; label: string }> = {
  green: { dot: "🟢", label: "Plug & play" },
  yellow: { dot: "🟡", label: "Some assembly" },
  red: { dot: "🔴", label: "Advanced" },
};

export default function DifficultyDot({
  difficulty,
  withLabel = false,
}: {
  difficulty: Difficulty | null;
  withLabel?: boolean;
}) {
  if (!difficulty) return null;
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span title={meta.label}>
      {meta.dot}
      {withLabel && ` ${meta.label}`}
    </span>
  );
}
